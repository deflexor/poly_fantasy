// ~4000 unique name combos
const ADJ = ["gray","brave","swift","quiet","bold","calm","deep","fierce","golden","holy","jolly","keen","lazy","mad","neat","old","proud","rare","shy","tiny","warm","young","bright","dark","eager","fast","gentle","happy","icy","loud","mild","nice","odd","plain","quick","rude","sharp","tough","vague","wild","ancient","brisk","cool","dizzy","early","fancy","grim","harsh","lucky","merry","noble","pure","rich","silly","sly","soft","swift","thick","thin","vivid","wiry","zesty","bald","civil","dusty","empty","fiery","glad","hazy","keen","limp","misty","neat","pale","rosy","sage","tall","vain","wiry","zany","ample","blunt","crisp","drunk","faint","grand","harsh","jade","lanky","mossy","nifty","pearl","ruddy","sandy","tawny","vaned","wavy","zonal","blond","chill","delft","eerie","frost","gawky","husky","ivory","jazzy","knotty","lemon","milky","nubby","oaken","peppy","quaky","rowdy","salty","tangy","ultra","veiny","wispy","yogic","zebra"]

const NOUN = ["parrot","tiger","otter","panda","fox","wolf","hawk","owl","bear","deer","lion","hare","seal","dove","crow","eel","bat","ram","elk","fox","cod","bug","bee","jay","koi","lynx","moth","newt","oryx","puma","ray","slug","toad","wren","yak","zho","ape","cat","dog","elk","flea","gnu","hen","ibis","kiwi","loon","mole","numbat","owl","pig","quail","rat","swan","tern","urial","viper","wasp","xenops","yak","zebra","crab","dove","eel","frog","goat","hyena","iguana","jackal","kite","lemur","mite","newt","osprey","pike","quoll","rook","squid","tick","urchin","vole","winkle","xerus","yabby","zero","adder","bison","coot","duck","egret","finch","gecko","heron","ibex","jaguar","kudu","llama","moose","nautilus","octopus","possum","quokka","raven","sable","tapir","urchin","vixen","weasel","xray","yerba","zebra","asp","boa","cow","dab","emu","fox","gull","hare","ibis","jay","kid","lamb","moth","newt","owl","pig","rat","skipper","turtle","urchin","vole","worm","xerus","yak","zebra"]

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateNickname(): string {
  return `${pick(ADJ)}-${pick(ADJ)}-${pick(NOUN)}-in-${pick(NOUN)}s`
}
