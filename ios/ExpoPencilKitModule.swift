import Foundation
import ExpoModulesCore
import PencilKit
import UIKit

public class ExpoPencilKitModule: Module {
    // Single canvas view approach like the working example
    private var canvasView: PKCanvasView?
    private var toolPicker: PKToolPicker?
    private var undoManager: UndoManager?
    private var colorPickerViewController: UIColorPickerViewController?
    private var colorPickerDelegate: ColorPickerDelegate?
    private var toolPickerObserver: ToolPickerObserver?

    public func definition() -> ModuleDefinition {
        Name("ExpoPencilKitModule")

        // Module lifecycle
        OnCreate {
            // Register this module instance with the view
            ExpoPencilKitView.setModuleInstance(self)
        }



        // View manager for PencilKit canvas
        View(ExpoPencilKitView.self) {
            Events("onDrawStart", "onDrawEnd", "onDrawChange", "onCanUndoChanged", "onCanRedoChanged")

            Prop("imagePath") { (view: ExpoPencilKitView, imagePath: [String: Any]?) in
                view.setImagePath(imagePath)
            }
        }

        // Setup tool picker for a specific canvas
        AsyncFunction("setupToolPicker") { (viewTag: Int) in
            await MainActor.run {
                self.setupToolPicker(for: viewTag)
            }
        }

        // Clear drawing from canvas
        AsyncFunction("clearDrawing") { (viewTag: Int) in
            await MainActor.run {
                self.clearDrawing()
            }
        }

        // Undo last drawing action
        AsyncFunction("undo") { (viewTag: Int) in
            await MainActor.run {
                self.undoDrawing()
            }
        }

        // Redo last undone drawing action
        AsyncFunction("redo") { (viewTag: Int) in
            await MainActor.run {
                self.redoDrawing()
            }
        }

        // Capture drawing as PNG image
        AsyncFunction("captureDrawing") { (viewTag: Int) -> String in
            return await MainActor.run {
                return self.captureDrawing()
            }
        }

        // Get canvas data as base64
        AsyncFunction("getCanvasDataAsBase64") { (viewTag: Int) -> String in
            return await MainActor.run {
                return self.getCanvasDataAsBase64()
            }
        }

        // Set canvas data from base64
        AsyncFunction("setCanvasDataFromBase64") { (viewTag: Int, base64String: String) -> Bool in
            return await MainActor.run {
                return self.setCanvasDataFromBase64(base64String: base64String)
            }
        }

        // Check if undo is possible
        AsyncFunction("canUndo") { (viewTag: Int) -> Bool in
            return await MainActor.run {
                return self.canPerformUndo()
            }
        }

        // Check if redo is possible
        AsyncFunction("canRedo") { (viewTag: Int) -> Bool in
            return await MainActor.run {
                return self.canPerformRedo()
            }
        }

        // Show color picker
        AsyncFunction("showColorPicker") { (viewTag: Int) in
            await MainActor.run {
                self.showColorPicker()
            }
        }

        // Set canvas background color
        AsyncFunction("setCanvasBackgroundColor") { (viewTag: Int, colorString: String) in
            await MainActor.run {
                self.setCanvasBackgroundColor(colorString)
            }
        }

        // Get canvas background color
        AsyncFunction("getCanvasBackgroundColor") { (viewTag: Int) -> String in
            return await MainActor.run {
                return self.getCanvasBackgroundColor()
            }
        }
    }

    // MARK: - Canvas Registration

    func registerCanvasView(_ canvas: PKCanvasView) {
        self.canvasView = canvas
    }

    func unregisterCanvasView() {
        self.canvasView = nil
        self.toolPicker = nil
        self.undoManager = nil
    }

    // MARK: - Private Methods

    private func setupToolPicker(for viewTag: Int) {
        guard let canvasView = self.canvasView else {
            return
        }

        toolPicker = PKToolPicker()

        // Configure tool picker
        toolPicker?.setVisible(true, forFirstResponder: canvasView)
        toolPicker?.addObserver(canvasView)

        // Create and add tool picker observer
        toolPickerObserver = ToolPickerObserver()
        toolPicker?.addObserver(toolPickerObserver!)

        // Make canvas view first responder
        canvasView.becomeFirstResponder()

        // Get the undo manager from canvas view
        undoManager = canvasView.undoManager
    }

    private func clearDrawing() {
        canvasView?.drawing = PKDrawing()
    }

    private func undoDrawing() {
        guard let undoManager = undoManager else {
            return
        }

        if undoManager.canUndo {
            undoManager.undo()
        }
    }

    private func redoDrawing() {
        guard let undoManager = undoManager else {
            return
        }

        if undoManager.canRedo {
            undoManager.redo()
        }
    }

    private func captureDrawing() -> String {
        guard let canvasView = canvasView else {
            return ""
        }

        let renderer = UIGraphicsImageRenderer(bounds: canvasView.bounds)
        let image = renderer.image { context in
            canvasView.drawHierarchy(in: canvasView.bounds, afterScreenUpdates: false)
        }

        guard let imageData = image.pngData() else {
            return ""
        }

        let base64String = imageData.base64EncodedString()
        return base64String
    }

    private func getCanvasDataAsBase64() -> String {
        guard let canvasView = canvasView else {
            return ""
        }

        let drawingData = canvasView.drawing.dataRepresentation()
        let base64String = drawingData.base64EncodedString()
        return base64String
    }

    private func setCanvasDataFromBase64(base64String: String) -> Bool {
        guard let canvasView = canvasView else {
            return false
        }

        guard let drawingData = Data(base64Encoded: base64String) else {
            return false
        }

        do {
            let drawing = try PKDrawing(data: drawingData)
            canvasView.drawing = drawing
            return true
        } catch {
            return false
        }
    }

    private func canPerformUndo() -> Bool {
        guard let undoManager = undoManager else {
            return false
        }

        return undoManager.canUndo
    }

    private func canPerformRedo() -> Bool {
        guard let undoManager = undoManager else {
            return false
        }

        return undoManager.canRedo
    }

    private func showColorPicker() {
        // Get the key window scene and root view controller
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            return
        }

        // Find the topmost presented view controller
        var topViewController = rootViewController
        while let presentedViewController = topViewController.presentedViewController {
            topViewController = presentedViewController
        }

        colorPickerViewController = UIColorPickerViewController()
        colorPickerDelegate = ColorPickerDelegate(module: self)
        colorPickerViewController?.delegate = colorPickerDelegate

        topViewController.present(colorPickerViewController!, animated: true)
    }

    private func setCanvasBackgroundColor(_ colorString: String) {
        let color = colorFromHexString(colorString)
        canvasView?.backgroundColor = color
    }

    private func getCanvasBackgroundColor() -> String {
        guard let canvasView = canvasView else {
            return "FFFFFF" // Default to white
        }

        return hexStringFromColor(canvasView.backgroundColor ?? UIColor.white)
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

    // MARK: - Color Picker Delegate Methods

    internal func colorPickerDidFinish(with color: UIColor) {
        canvasView?.backgroundColor = color
    }

    internal func colorPickerDidSelectColor(_ color: UIColor) {
        canvasView?.backgroundColor = color
    }


}

// MARK: - Tool Picker Observer Helper Class

private class ToolPickerObserver: NSObject, PKToolPickerObserver {

    func toolPickerFramesObscuredDidChange(_ toolPicker: PKToolPicker) {
        // Tool picker frames obscured changed
    }

    func toolPickerVisibilityDidChange(_ toolPicker: PKToolPicker) {
        // Tool picker visibility changed
    }

    func toolPickerIsRulerActiveDidChange(_ toolPicker: PKToolPicker) {
        // Tool picker ruler active changed
    }

    func toolPickerSelectedToolDidChange(_ toolPicker: PKToolPicker) {
        // Tool picker selected tool changed
    }
}

// MARK: - Color Picker Delegate Helper Class

private class ColorPickerDelegate: NSObject, UIColorPickerViewControllerDelegate {
    weak var module: ExpoPencilKitModule?

    init(module: ExpoPencilKitModule) {
        self.module = module
        super.init()
    }

    func colorPickerViewControllerDidFinish(_ viewController: UIColorPickerViewController) {
        module?.colorPickerDidFinish(with: viewController.selectedColor)
        viewController.dismiss(animated: true)
    }

    func colorPickerViewControllerDidSelectColor(_ viewController: UIColorPickerViewController) {
        module?.colorPickerDidSelectColor(viewController.selectedColor)
    }
}