// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "NativeCursorOverlay",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "bluearchive-cursor-overlay", targets: ["BlueArchiveCursorOverlay"])
    ],
    targets: [
        .executableTarget(
            name: "BlueArchiveCursorOverlay",
            path: "Sources"
        )
    ]
)
