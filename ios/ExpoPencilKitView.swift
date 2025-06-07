import Foundation
import ExpoModulesCore
import PencilKit
import UIKit

public class ExpoPencilKitView: ExpoView, PKCanvasViewDelegate, PKToolPickerObserver, UIScrollViewDelegate {
    private let canvasView = PKCanvasView()
    private var imageView: UIImageView?

    // Static reference to module for communication
    private static weak var moduleInstance: ExpoPencilKitModule?

    // Event handlers
    let onDrawStart = EventDispatcher()
    let onDrawEnd = EventDispatcher()
    let onDrawChange = EventDispatcher()
    let onCanUndoChanged = EventDispatcher()
    let onCanRedoChanged = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        setupCanvasView()
    }

    private func setupCanvasView() {
        // Configure canvas view exactly like the working example
        canvasView.drawingPolicy = .anyInput
        canvasView.overrideUserInterfaceStyle = .light
        canvasView.isMultipleTouchEnabled = true
        canvasView.isOpaque = true
        canvasView.backgroundColor = UIColor.clear
        canvasView.delegate = self
        canvasView.isScrollEnabled = true
        canvasView.isUserInteractionEnabled = true
        canvasView.minimumZoomScale = 1.0
        canvasView.maximumZoomScale = 4.0
        canvasView.bounces = false
        canvasView.bouncesZoom = false

        // Initialize with empty drawing
        canvasView.drawing = PKDrawing()

        // Add canvas view to this view
        addSubview(canvasView)
        canvasView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            canvasView.topAnchor.constraint(equalTo: topAnchor),
            canvasView.leadingAnchor.constraint(equalTo: leadingAnchor),
            canvasView.trailingAnchor.constraint(equalTo: trailingAnchor),
            canvasView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])


    }

    public override func didMoveToSuperview() {
        super.didMoveToSuperview()

        if superview != nil {
            // Register canvas view with the module
            ExpoPencilKitView.moduleInstance?.registerCanvasView(canvasView)

        } else {
            // Unregister when removed from superview
            ExpoPencilKitView.moduleInstance?.unregisterCanvasView()

        }
    }

    // Static method for module to register itself
    static func setModuleInstance(_ module: ExpoPencilKitModule) {
        moduleInstance = module
    }

    // MARK: - Props

    func setImagePath(_ imagePath: [String: Any]?) {
        guard let imagePath = imagePath,
              let uriString = imagePath["uri"] as? String,
              let url = URL(string: uriString) else {
            return
        }

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let data = try? Data(contentsOf: url),
                  let image = UIImage(data: data) else {
                return
            }

            DispatchQueue.main.async {
                self?.setBackgroundImage(image)
            }
        }
    }

    private func setBackgroundImage(_ image: UIImage) {
        // Remove existing image view
        imageView?.removeFromSuperview()

        // Create new image view
        imageView = UIImageView(image: image)
        imageView?.contentMode = .scaleAspectFit
        imageView?.frame = bounds

        // Create a white background view
        let backgroundView = UIView(frame: bounds)
        backgroundView.backgroundColor = UIColor.white
        backgroundView.addSubview(imageView!)

        // Render the background view to an image
        let renderer = UIGraphicsImageRenderer(bounds: backgroundView.bounds)
        let backgroundImage = renderer.image { context in
            backgroundView.drawHierarchy(in: backgroundView.bounds, afterScreenUpdates: true)
        }

        // Set the rendered image as background
        imageView = UIImageView(image: backgroundImage)
        canvasView.insertSubview(imageView!, at: 0)

        // Update image view frame when canvas view bounds change
        imageView?.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            imageView!.topAnchor.constraint(equalTo: canvasView.topAnchor),
            imageView!.leadingAnchor.constraint(equalTo: canvasView.leadingAnchor),
            imageView!.trailingAnchor.constraint(equalTo: canvasView.trailingAnchor),
            imageView!.bottomAnchor.constraint(equalTo: canvasView.bottomAnchor)
        ])
    }

    // MARK: - PKCanvasViewDelegate

    public func canvasViewDidBeginUsingTool(_ canvasView: PKCanvasView) {
        let data = canvasView.drawing.dataRepresentation().base64EncodedString()
        onDrawStart([
            "data": data
        ])
    }

    public func canvasViewDidEndUsingTool(_ canvasView: PKCanvasView) {
        let data = canvasView.drawing.dataRepresentation().base64EncodedString()
        onDrawEnd([
            "data": data
        ])
        emitUndoRedoStateChanges()
    }

    public func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
        let data = canvasView.drawing.dataRepresentation().base64EncodedString()
        onDrawChange([
            "data": data
        ])
        emitUndoRedoStateChanges()
    }

    // MARK: - UIScrollViewDelegate

    public func viewForZooming(in scrollView: UIScrollView) -> UIView? {
        return imageView
    }

    public func scrollViewDidZoom(_ scrollView: UIScrollView) {
        guard let imageView = imageView else { return }

        let offsetX = max((scrollView.bounds.size.width - scrollView.contentSize.width) * 0.5, 0.0)
        let offsetY = max((scrollView.bounds.size.height - scrollView.contentSize.height) * 0.5, 0.0)

        imageView.frame = CGRect(
            x: imageView.frame.origin.x,
            y: imageView.frame.origin.y,
            width: canvasView.frame.size.width * scrollView.zoomScale,
            height: canvasView.frame.size.height * scrollView.zoomScale
        )

        imageView.center = CGPoint(
            x: scrollView.contentSize.width * 0.5 + offsetX,
            y: scrollView.contentSize.height * 0.5 + offsetY
        )
    }

    // MARK: - PKToolPickerObserver

    public func toolPickerFramesObscuredDidChange(_ toolPicker: PKToolPicker) {
        // Handle tool picker frame changes if needed
    }

    public func toolPickerVisibilityDidChange(_ toolPicker: PKToolPicker) {
        // Handle tool picker visibility changes if needed
    }

    public func toolPickerIsRulerActiveDidChange(_ toolPicker: PKToolPicker) {
        // Handle ruler state changes if needed
    }

    public func toolPickerSelectedToolDidChange(_ toolPicker: PKToolPicker) {
        // Handle tool selection changes if needed
    }

    // MARK: - Helper Methods

    private func emitUndoRedoStateChanges() {
        guard let undoManager = canvasView.undoManager else { return }

        let canUndo = undoManager.canUndo
        let canRedo = undoManager.canRedo

        onCanUndoChanged([
            "canUndo": canUndo
        ])
        onCanRedoChanged([
            "canRedo": canRedo
        ])
    }

    // Override to allow becoming first responder
    public override var canBecomeFirstResponder: Bool {
        return canvasView.canBecomeFirstResponder
    }

    public override func becomeFirstResponder() -> Bool {
        return canvasView.becomeFirstResponder()
    }

    public override func resignFirstResponder() -> Bool {
        return canvasView.resignFirstResponder()
    }



    // MARK: - Helper Methods

    private func colorFromHexString(_ hexString: String) -> UIColor {
        var hexSanitized = hexString.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)

        let red, green, blue, alpha: CGFloat

        if hexSanitized.count <= 6 {
            // RGB format
            red = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
            green = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
            blue = CGFloat(rgb & 0x0000FF) / 255.0
            alpha = 1.0
        } else {
            // RGBA format
            red = CGFloat((rgb & 0xFF000000) >> 24) / 255.0
            green = CGFloat((rgb & 0x00FF0000) >> 16) / 255.0
            blue = CGFloat((rgb & 0x0000FF00) >> 8) / 255.0
            alpha = CGFloat(rgb & 0x000000FF) / 255.0
        }

        return UIColor(red: red, green: green, blue: blue, alpha: alpha)
    }

    private func hexStringFromColor(_ color: UIColor) -> String {
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0

        color.getRed(&red, green: &green, blue: &blue, alpha: &alpha)

        let redInt = Int(red * 255.0)
        let greenInt = Int(green * 255.0)
        let blueInt = Int(blue * 255.0)

        return String(format: "%02X%02X%02X", redInt, greenInt, blueInt)
    }
}

// MARK: - Color Picker Delegate Helper Class for Ref Methods

private class ColorPickerDelegate: NSObject, UIColorPickerViewControllerDelegate {
    private let onColorSelected: (UIColor) -> Void

    init(onColorSelected: @escaping (UIColor) -> Void) {
        self.onColorSelected = onColorSelected
        super.init()
    }

    func colorPickerViewControllerDidFinish(_ viewController: UIColorPickerViewController) {
        onColorSelected(viewController.selectedColor)
        viewController.dismiss(animated: true)
    }

    func colorPickerViewControllerDidSelectColor(_ viewController: UIColorPickerViewController) {
        onColorSelected(viewController.selectedColor)
    }
}