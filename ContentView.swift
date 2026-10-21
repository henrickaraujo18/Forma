import SwiftUI

struct ContentView: View {
    @EnvironmentObject var store: FormaStore
    var body: some View {
        TabView {
            NavigationStack { List { Section("Seu progresso") { Text("Registre treinos, medidas e medicamentos. Os dados ficam neste iPhone.") }; Section("Último peso") { if let m = store.measurements.sorted(by: {$0.date > $1.date}).first { Text("\(m.weight, specifier: "%.1f") kg · \(m.date.formatted(date: .abbreviated, time: .omitted))") } else { Text("Nenhuma medição cadastrada") } } }.navigationTitle("Forma") }.tabItem { Label("Início", systemImage:"house") }
            NavigationStack { List { ForEach($store.workouts) { $workout in NavigationLink(workout.name) { WorkoutDetail(workout: $workout) } } }.navigationTitle("Treinos") }.tabItem { Label("Treinos", systemImage:"dumbbell") }
            NavigationStack { MeasurementsView().navigationTitle("Evolução") }.tabItem { Label("Medidas", systemImage:"chart.line.uptrend.xyaxis") }
            NavigationStack { MedicationsView().navigationTitle("Medicamentos") }.tabItem { Label("Medicamentos", systemImage:"pills") }
        }
    }
}

struct WorkoutDetail: View {
    @Binding var workout: Workout
    @State private var newName = ""
    var body: some View {
        List {
            ForEach($workout.exercises) { $exercise in
                VStack(alignment:.leading, spacing:8) {
                    TextField("Exercício", text:$exercise.name).font(.headline)
                    HStack { Stepper("Séries: \(exercise.sets)", value:$exercise.sets, in:1...10); TextField("Reps", text:$exercise.reps).frame(width:65) }
                    TextField("Carga (kg)", text:$exercise.load).keyboardType(.decimalPad)
                }.padding(.vertical,4)
            }.onDelete { workout.exercises.remove(atOffsets:$0) }
            HStack { TextField("Novo exercício", text:$newName); Button("Adicionar") { guard !newName.trimmingCharacters(in:.whitespaces).isEmpty else{return}; workout.exercises.append(Exercise(name:newName)); newName="" } }
        }.navigationTitle("Treino \(workout.name)").toolbar { EditButton() }
    }
}

struct MeasurementsView: View {
    @EnvironmentObject var store: FormaStore
    @State private var weight = ""
    @State private var waist = ""
    var body: some View {
        List {
            Section("Nova medição") { TextField("Peso (kg)", text:$weight).keyboardType(.decimalPad); TextField("Cintura (cm)", text:$waist).keyboardType(.decimalPad); Button("Salvar medição") { guard let w = Double(weight.replacingOccurrences(of:",",with:".")) else{return}; store.measurements.append(Measurement(weight:w, waist:Double(waist.replacingOccurrences(of:",",with:".")) ?? 0)); weight=""; waist="" } }
            Section("Histórico") { ForEach(store.measurements.sorted(by:{$0.date > $1.date})) { m in HStack { VStack(alignment:.leading) { Text(m.date.formatted(date:.abbreviated,time:.omitted)); Text("Cintura: \(m.waist, specifier:"%.1f") cm").font(.caption).foregroundStyle(.secondary) }; Spacer(); Text("\(m.weight, specifier:"%.1f") kg").bold() } }.onDelete { offsets in let sorted = store.measurements.sorted(by:{$0.date > $1.date}); for i in offsets { store.measurements.removeAll{$0.id == sorted[i].id} } } }
        }
    }
}

struct MedicationsView: View {
    @EnvironmentObject var store: FormaStore
    @State private var name = ""
    @State private var dose = ""
    @State private var time = "08:00"
    var body: some View {
        List {
            Section("Adicionar medicamento") { TextField("Nome", text:$name); TextField("Dose", text:$dose); TextField("Horário (ex. 08:00)", text:$time); Button("Cadastrar") { guard !name.isEmpty else{return}; store.medications.append(Medication(name:name,dose:dose,time:time)); name=""; dose="" } }
            Section("Minha lista") { ForEach($store.medications) { $med in HStack { VStack(alignment:.leading) { Text(med.name).font(.headline); Text("\(med.dose) · \(med.time)").font(.caption) }; Spacer(); Toggle("Tomado", isOn:$med.taken).labelsHidden() } }.onDelete { store.medications.remove(atOffsets:$0) } }
        }
    }
}
