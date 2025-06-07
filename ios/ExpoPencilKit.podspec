Pod::Spec.new do |s|
  s.name           = 'ExpoPencilKitUI'
  s.version        = '1.0.1'
  s.summary        = 'Expo module for PencilKit integration'
  s.description    = 'A native module that provides PencilKit functionality for React Native apps using Expo'
  s.author         = 'Tarik Pinarci'
  s.homepage       = 'https://github.com/tarikfp/expo-pencilkit-ui'
  s.platforms      = { :ios => '13.0', :tvos => '13.0' }
  s.source         = { git: 'https://github.com/tarikfp/expo-pencilkit-ui.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end