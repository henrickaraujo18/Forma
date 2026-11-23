/* Forma Fitness: biblioteca audiovisual CC0 pesquisada e atribuída por movimento.
 * Os movimentos com vídeo MP4 provêm de https://github.com/namnq/workout-free-videos (CC0 1.0).
 * As animações (frames) provêm de https://github.com/MarvinNazari/exercise-images (CC0 1.0).
 * Não são transcodificadas nem revendidas: carregamento direto do CDN do projeto de origem.
 */
export const VIDEO_SOURCE="https://github.com/namnq/workout-free-videos";
export const MOTION_SOURCE="https://github.com/MarvinNazari/exercise-images";
export const MP4_BASE="https://cdn.jsdelivr.net/gh/namnq/workout-free-videos@v2.0.0/media/video/";
export const FRAMES_BASE="https://cdn.jsdelivr.net/gh/MarvinNazari/exercise-images@main/images/";
const nameKey=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const video=(slug,variant="")=>({type:"video",slug,duration:8,variant});
const motion=(slug,variant="")=>({type:"motion",slug,duration:8,variant});
const MAP={
 "crucifixo inclinado com halteres":motion("incline-dumbbell-fly"),
 "supino reto":motion("bench-press"),
 "cross over polia baixa":motion("cable-fly-low-to-high"),
 "elevacao lateral na polia":motion("cable-lateral-raise"),
 "elevacao frontal com halteres":motion("front-raises"),
 "triceps na polia":motion("tricep-pushdowns"),
 "triceps frances com corda":motion("cable-overhead-triceps-extension","Demonstração da extensão acima da cabeça na polia; a pegada pode diferir da corda."),
 "abdominal com rolinho ou na barra fixa":motion("ab-wheel-rollout","Demonstração da opção com rolinho, não da alternativa na barra fixa."),
 "puxador alto com triangulo":motion("close-grip-lat-pulldown"),
 "remada unilateral maquina ou meadows":motion("meadows-row","Demonstração da alternativa Meadows, não da máquina."),
 "remada curvada com barra":video("bent-over-row"),
 "pulldown bilateral com barra":video("straight-arm-lat-pull-down"),
 "levantamento terra barra livre":motion("deadlift"),
 "rosca alternada em pe":motion("alternating-dumbbell-curl"),
 "cadeira extensora":motion("leg-extension"),
 "stiff com halteres":motion("dumbbell-romanian-deadlift","Demonstração de levantamento romeno com halteres (variação próxima do stiff)."),
 "hack machine":video("machine-hack-squat"),
 "panturrilha no leg press":video("45-degree-leg-press-calf-raise"),
 "supino inclinado smith ou livre":video("incline-bench-press","Demonstração da opção com barra livre, não no Smith."),
 "elevacao lateral em pe na polia":motion("cable-lateral-raise"),
 "elevacao frontal em pe com halteres":motion("front-raises"),
 "t bar ou remada cavalinho maquina":video("machine-t-bar-row","Demonstração de máquina T-Bar."),
 "levantamento terra completo":motion("deadlift"),
 "triceps testa com halter":motion("dumbbell-skull-crusher"),
 "triceps frances com halter":motion("overhead-triceps-extension"),
 "rosca bayesian na polia em pe":motion("single-arm-cable-curl","Variação de rosca na polia: o posicionamento do braço não reproduz exatamente a rosca Bayesian."),
 "mesa flexora":motion("leg-curl"),
 "stiff com barra":video("stiff-leg-deadlift"),
 "simulador de agachamento":motion("v-squat","O modelo e a trajetória do simulador podem diferir do equipamento da academia."),
 "bulgaro com halteres":motion("bulgarian-split-squat"),
 "panturrilha unilateral no leg press":motion("leg-press-calf-raise","Vídeo de movimento bilateral. Execute unilateralmente conforme a ficha."),
 "manguito rotador polia rotacao externa":motion("cable-external-rotation"),
 "elevacao frontal com halteres em pe":motion("front-raises"),
 "levantamento terra":motion("deadlift"),
 "leg press 45 graus":video("leg-press"),
 "pulldown unilateral na polia":motion("lat-pulldown","Variação bilateral. Na ficha, o movimento é unilateral."),
 "remada meadows":motion("meadows-row"),
 "crucifixo inverso na polia":video("bent-over-low-pulley-rear-delt-fly"),
 "elevacao frontal na polia":motion("cable-front-raise"),
 "desenvolvimento militar sentado":motion("dumbbell-shoulder-press","Variação com halteres; equipamento e posição podem diferir da ficha."),
 "elevacao pelvica com barra":video("barbell-hip-thrust"),
 "agachamento livre com barra":video("barbell-back-squat"),
 "terra sumo com halter":motion("kettlebell-sumo-deadlift","Variação com kettlebell, em lugar do halter da ficha."),
 "panturrilha sentado":video("seated-calf-raise")
};
export const MEDIA_MAP=Object.freeze(MAP);
export function validVideoUrl(value){
 if(!value)return false;
 try{
  const url=new URL(String(value).trim());
  return url.protocol==="https:" && /\.(?:mp4|webm)(?:$|\?)/i.test(url.pathname+url.search);
 }catch{return false}
}
export function demoFor(exercise){
 const raw=exercise?.videoUrl;
 if(validVideoUrl(raw))return {type:"video",src:String(raw).trim(),duration:8,variant:"Vídeo personalizado",source:"personalizado"};
 const media=MAP[nameKey(exercise?.name)];
 if(!media)return null;
 if(media.type==="video")return {...media,src:MP4_BASE+media.slug+".mp4",source:VIDEO_SOURCE};
 return {...media,start:FRAMES_BASE+media.slug+"/start.webp",end:FRAMES_BASE+media.slug+"/end.webp",source:MOTION_SOURCE};
}
export function mediaCount(){
 const values=Object.values(MAP);
 return {total:values.length,videos:values.filter(m=>m.type==="video").length,animations:values.filter(m=>m.type==="motion").length};
}
