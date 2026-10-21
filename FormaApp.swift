import SwiftUI

@main
struct FormaApp: App {
    @StateObject private var store = FormaStore()
    var body: some Scene {
        WindowGroup { ContentView().environmentObject(store) }
    }
}

struct Workout: Identifiable, Codable {
    var id = UUID()
    var name: String
    var exercises: [Exercise]
}
struct Exercise: Identifiable, Codable {
    var id = UUID()
    var name: String
    var sets: Int = 3
    var reps: String = "8–12"
    var load: String = ""
}
struct Measurement: Identifiable, Codable {
    var id = UUID()
    var date: Date = .now
    var weight: Double
    var waist: Double = 0
    var notes: String = ""
}
struct Medication: Identifiable, Codable {
    var id = UUID()
    var name: String
    var dose: String
    var time: String
    var taken: Bool = false
}

@MainActor final class FormaStore: ObservableObject {
    @Published var workouts: [Workout] = [] { didSet { save(workouts, key: "workouts") } }
    @Published var measurements: [Measurement] = [] { didSet { save(measurements, key: "measurements") } }
    @Published var medications: [Medication] = [] { didSet { save(medications, key: "medications") } }
    init() {
        workouts = load([Workout].self, key: "workouts") ?? Self.defaultWorkouts
        measurements = load([Measurement].self, key: "measurements") ?? []
        medications = load([Medication].self, key: "medications") ?? []
    }
    private func save<T: Encodable>(_ value: T, key: String) { if let data = try? JSONEncoder().encode(value) { UserDefaults.standard.set(data, forKey: key) } }
    private func load<T: Decodable>(_ type: T.Type, key: String) -> T? { guard let d = UserDefaults.standard.data(forKey: key) else { return nil }; return try? JSONDecoder().decode(type, from: d) }
    static let defaultWorkouts: [Workout] = [
        Workout(name:"A", exercises:[Exercise(name:"Supino reto"),Exercise(name:"Supino inclinado"),Exercise(name:"Desenvolvimento"),Exercise(name:"Tríceps")]),
        Workout(name:"B", exercises:[Exercise(name:"Agachamento"),Exercise(name:"Leg press"),Exercise(name:"Cadeira extensora"),Exercise(name:"Panturrilha")]),
        Workout(name:"C", exercises:[Exercise(name:"Puxada alta"),Exercise(name:"Remada"),Exercise(name:"Rosca bíceps"),Exercise(name:"Posterior de ombro")]),
        Workout(name:"Upper", exercises:[Exercise(name:"Supino"),Exercise(name:"Remada"),Exercise(name:"Desenvolvimento"),Exercise(name:"Braços")]),
        Workout(name:"Lower", exercises:[Exercise(name:"Agachamento"),Exercise(name:"Levantamento terra romeno"),Exercise(name:"Leg press"),Exercise(name:"Panturrilha")])
    ]
}
