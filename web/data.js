/* Forma Fitness · rotinas importadas das fichas de 30/03/2026.
   Campos: nome, grupo, warm-up, feeder, working, top, descanso, observações. */
export const VERSION = "2.0.0";
const mk = (name,muscle,warm,feeder,working,top,rest=120,notes="") => ({
  id: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),
  name,muscle,rest,notes,sets:[
    ...expand("Aquecimento",warm),
    ...expand("Feeder",feeder),
    ...expand("Trabalho",working),
    ...expand("Top",top)
  ]
});
function expand(type, spec) {
  if (!spec || spec === "-") return [];
  const [count,reps] = spec.split("@");
  return Array.from({length:Number(count)},()=>({type,target:reps,weight:"",reps:"",rpe:"",done:false}));
}
const ex = (name,muscle,warm,feeder,working,top,rest,notes) => mk(name,muscle,warm,feeder,working,top,rest,notes);
export const STARTER_PROFILES=[
  {id:"henrick",name:"Henrick",accent:"#b0ef60",height:"",goal:"Recomposição corporal",plan:"henrick",picture:""},
  {id:"cecilia",name:"Cecília",accent:"#df9feb",height:"",goal:"Saúde e condicionamento",plan:"cecilia",picture:""}
];
export const STARTER_ROUTINES = {
  henrick:[
    {id:"h-a",name:"Treino A",subtitle:"Peitoral · Ombro · Tríceps · ABS",source:"FICHA HENRICK · PÁGS. 1-2",exercises:[
      ex("Crucifixo inclinado com halteres","Peito","1@8-10","1@4-5","2@8-12","-",90),
      ex("Supino reto","Peito","1@10-12","1@4-5","2@6-8","1@4-6",90),
      ex("Cross over polia baixa","Peito","-","1@6-8","3@8-10","-",90),
      ex("Elevação lateral na polia","Ombros","-","1@6","2@6-8","2@4-6",90),
      ex("Elevação frontal com halteres","Ombros","-","1@3-6","3@6-8","2@4-8",90),
      ex("Tríceps na polia","Tríceps","1@8","1@6-8","4@8","-",150,"Costas apoiadas na polia, se possível."),
      ex("Tríceps francês com corda","Tríceps","1@4-5","-","2@10-12","1@4-6",90,"Até a falha concêntrica nas séries de trabalho."),
      ex("Abdominal com rolinho ou na barra fixa","Abdômen","-","-","4@Falha","-",90)
    ]},
    {id:"h-b",name:"Treino B",subtitle:"Costas · Bíceps",source:"FICHA HENRICK · PÁG. 3",exercises:[
      ex("Puxador alto com triângulo","Costas","1@4-5","1@7-10","3@8-10","1@4-6",90),
      ex("Remada unilateral máquina ou Meadows","Costas","-","1@4-6","2@10-12","-",90),
      ex("Remada curvada com barra","Costas","1@8-10","1@6-8","1@12","4@4-6",150),
      ex("Pulldown bilateral com barra","Costas","-","1@4-6","4@10-12","-",150),
      ex("Levantamento terra barra livre","Posterior","1@4-6","-","4@4-6","-",150),
      ex("Rosca alternada em pé","Bíceps","1@4-6","-","3@8-10","-",90)
    ]},
    {id:"h-c",name:"Treino C",subtitle:"Pernas · Panturrilha",source:"FICHA HENRICK · PÁG. 4",exercises:[
      ex("Cadeira extensora","Quadríceps","1@18-20","1@4-6","4@8-10","-",90,"Dead stop."),
      ex("Stiff com halteres","Posterior","1@12","1@4-6","4@6-8","-",150),
      ex("Hack machine","Quadríceps","1@8-10","1@4-6","3@5-6","1@6",150,"Cargas altas conforme prescrição."),
      ex("Panturrilha no leg press","Panturrilha","-","-","3@10-12","-",150,"Alongar panturrilha por 30 s após a série.")
    ]},
    {id:"h-upper",name:"Upper",subtitle:"Superiores · Misto",source:"FICHA HENRICK · PÁGS. 4-5",exercises:[
      ex("Crucifixo inclinado com halteres","Peito","1@8-10","1@4-5","3@8-12","-",90),
      ex("Supino inclinado Smith ou livre","Peito","-","1@6","2@8","-",120),
      ex("Elevação lateral em pé na polia","Ombros","1@10-12","1@6","2@6-8","-",90),
      ex("Elevação frontal em pé com halteres","Ombros","-","1@4-6","2@6-8","-",90),
      ex("T-Bar ou remada cavalinho máquina","Costas","1@10","2@3-6","3@6-8","-",180),
      ex("Levantamento terra completo","Posterior","1@8-10","1@5-6","3@5-9","-",150),
      ex("Tríceps testa com halter","Tríceps","1@8","1@6-8","3@8","-",150),
      ex("Tríceps francês com halter","Tríceps","1@4-5","-","3@10-12","-",180,"Até uma falha concêntrica."),
      ex("Rosca Bayesian na polia em pé","Bíceps","1@4-6","-","3@8-10","-",120)
    ]},
    {id:"h-lower",name:"Lower",subtitle:"Inferiores · Misto",source:"FICHA HENRICK · PÁGS. 5-6",exercises:[
      ex("Mesa flexora","Posterior","1@18-20","2@4-6","4@8-10","1@4",150),
      ex("Stiff com barra","Posterior","1@12","1@4-6","4@6-8","-",150,"Alongamento por 30 s após o exercício."),
      ex("Simulador de agachamento","Quadríceps","1@6-8","1@4-6","3@5-8","-",240),
      ex("Búlgaro com halteres","Quadríceps","-","1@6-7","2@8-10","-",150),
      ex("Cadeira extensora","Quadríceps","1@6-8","-","4@6-8","-",150,"Cargas altas conforme prescrição."),
      ex("Panturrilha unilateral no leg press","Panturrilha","-","-","5@10-12","-",150,"Alongar 30 s após cada série.")
    ]}
  ],
  cecilia:[
    {id:"c-upper1",name:"Upper 01",subtitle:"Ombros · Costas · Braços",source:"FICHA CECÍLIA · PÁGS. 2-3",exercises:[
      ex("Manguito rotador polia · rotação externa","Ombros","-","1@6","1@8","-",120),
      ex("Elevação lateral em pé na polia","Ombros","1@10-12","1@6","3@6-8","-",90),
      ex("Elevação frontal com halteres em pé","Ombros","-","1@4-6","1@6-8","-",90),
      ex("T-Bar ou remada cavalinho máquina","Costas","1@10","1@3-6","2@6-8","-",180),
      ex("Levantamento terra","Posterior","1@8-10","1@5-6","2@5-9","-",150),
      ex("Tríceps testa com halter","Tríceps","1@8","1@6-8","1@8","-",150),
      ex("Tríceps francês com halter","Tríceps","1@4-5","-","1@10-12","-",180,"Até uma falha concêntrica."),
      ex("Rosca Bayesian na polia em pé","Bíceps","1@4-6","-","2@8-10","-",120)
    ]},
    {id:"c-lower2",name:"Lower 02",subtitle:"Posterior · Quadríceps · Panturrilha",source:"FICHA CECÍLIA · PÁGS. 3-4",exercises:[
      ex("Mesa flexora","Posterior","1@18-20","1@4-6","4@8-10","1@4",150),
      ex("Stiff com barra","Posterior","1@12","1@4-6","4@6-8","-",150,"Alongamento por 30 s após exercício."),
      ex("Leg press 45 graus","Quadríceps","1@6-8","1@4-6","3@5-8","-",240),
      ex("Búlgaro com halteres","Quadríceps","-","1@6-7","2@8-10","-",150),
      ex("Cadeira extensora","Quadríceps","1@6-8","-","4@6-8","-",150,"Carga alta."),
      ex("Panturrilha unilateral no leg press","Panturrilha","-","-","5@10-12","-",150,"Alongar por 30 s após cada série.")
    ]},
    {id:"c-upper3",name:"Upper 03",subtitle:"Costas · Ombros",source:"FICHA CECÍLIA · PÁGS. 4-5",exercises:[
      ex("Pulldown unilateral na polia","Costas","1@4-5","1@7-10","1@8-10","-",150),
      ex("Puxador alto com triângulo","Costas","1@8-10","1@10-12","2@10-12","-",150),
      ex("Remada Meadows","Costas","1@10","-","2@8-10","-",180),
      ex("Crucifixo inverso na polia","Ombros","-","1@6-8","2@8-10","-",120,"Polia na linha aproximada do mamilo."),
      ex("Elevação frontal na polia","Ombros","-","1@4-6","2@10-12","-",120),
      ex("Desenvolvimento militar sentado","Ombros","1@4-6","-","3@8-10","-",90)
    ]},
    {id:"c-lower4",name:"Lower 04",subtitle:"Glúteos · Posterior · Pernas",source:"FICHA CECÍLIA · PÁGS. 5-6",exercises:[
      ex("Elevação pélvica com barra","Glúteos","1@18-20","1@5-6","4@5-9","1@4-5",150),
      ex("Búlgaro com halteres","Quadríceps","1@10","-","3@8-10","-",90),
      ex("Agachamento livre com barra","Quadríceps","1@6-8","-","3@6-9","-",150),
      ex("Mesa flexora","Posterior","-","1@8-10","3@6-8","-",150,"Alongar posterior 30 s após cada série."),
      ex("Terra sumô com halter","Glúteos","1@8-10","1@4-6","3@6-8","-",150),
      ex("Panturrilha sentado","Panturrilha","-","-","5@10-12 + 5 parciais","-",150)
    ]}
  ]
};
export const CARDIO_GUIDANCE = {
 henrick:"Ficha: pelo menos 2 HIIT de 10 min + 2 sessões de cardio de baixa intensidade por semana. Há sugestão de dia sem musculação com 60 min de cardio. Ajustar conforme recuperação e orientação profissional.",
 cecilia:"Ficha: 20–30 min de cardio após musculação (bike ou esteira) e 50 min nos dias sem musculação (escada ou bike). Ciclo de 2 treinos e 1 dia de descanso de musculação."
};
