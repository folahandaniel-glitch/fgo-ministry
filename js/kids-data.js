/* ============================================================
   Children's Department — Bible story icons and starter content
   ============================================================ */

const KID_ICONS = {
  sun: `<circle cx="50" cy="50" r="20" fill="#FFC93C"/>${[0,45,90,135,180,225,270,315].map(a=>`<line x1="50" y1="50" x2="${50+35*Math.cos(a*Math.PI/180)}" y2="${50+35*Math.sin(a*Math.PI/180)}" stroke="#FFC93C" stroke-width="5" stroke-linecap="round"/>`).join('')}`,
  tree: `<rect x="44" y="55" width="12" height="35" rx="3" fill="#8B5A2B"/><circle cx="50" cy="45" r="28" fill="#2ECC71"/><circle cx="30" cy="55" r="18" fill="#27AE60"/><circle cx="70" cy="55" r="18" fill="#27AE60"/>`,
  ark: `<path d="M15 55 Q50 78 85 55 L78 68 Q50 82 22 68 Z" fill="#8B5A2B"/><rect x="30" y="30" width="40" height="26" rx="4" fill="#C69C6D"/><rect x="38" y="38" width="8" height="8" fill="#2E86DE"/><rect x="54" y="38" width="8" height="8" fill="#2E86DE"/><path d="M15 55 L85 55" stroke="#2E86DE" stroke-width="6"/>`,
  rainbow: `<path d="M15 75 A35 35 0 0 1 85 75" stroke="#E74C3C" stroke-width="6" fill="none"/><path d="M22 75 A28 28 0 0 1 78 75" stroke="#FF9F43" stroke-width="6" fill="none"/><path d="M29 75 A21 21 0 0 1 71 75" stroke="#FFC93C" stroke-width="6" fill="none"/><path d="M36 75 A14 14 0 0 1 64 75" stroke="#2ECC71" stroke-width="6" fill="none"/><path d="M43 75 A7 7 0 0 1 57 75" stroke="#2E86DE" stroke-width="6" fill="none"/>`,
  dove: `<ellipse cx="50" cy="52" rx="22" ry="14" fill="#fff"/><path d="M50 46 Q68 30 82 38 Q68 42 60 50 Z" fill="#f2f2f2"/><circle cx="34" cy="48" r="6" fill="#fff"/><path d="M28 47 L18 44 L28 51 Z" fill="#FFC93C"/><circle cx="32" cy="46" r="1.5" fill="#333"/><path d="M30 66 Q22 76 12 74" stroke="#2ECC71" stroke-width="3" fill="none"/>`,
  water: `<path d="M10 45 Q25 35 40 45 T70 45 T100 45 L100 90 L10 90 Z" fill="#2E86DE"/><path d="M10 60 Q25 50 40 60 T70 60 T100 60 L100 90 L10 90 Z" fill="#1B6FC9"/>`,
  manger: `<path d="M20 70 L35 40 L65 40 L80 70 Z" fill="#8B5A2B"/><rect x="30" y="70" width="40" height="8" fill="#C69C6D"/><circle cx="50" cy="55" r="10" fill="#FFC93C"/><circle cx="50" cy="50" r="5" fill="#FFE9A8"/>`,
  cross: `<rect x="44" y="18" width="12" height="64" rx="3" fill="#F4EFE3"/><rect x="22" y="38" width="56" height="12" rx="3" fill="#F4EFE3"/>`,
  crown: `<path d="M20 65 L28 35 L42 55 L50 30 L58 55 L72 35 L80 65 Z" fill="#FFC93C"/><rect x="20" y="65" width="60" height="10" fill="#FFC93C"/><circle cx="50" cy="30" r="4" fill="#FF6FA5"/>`,
  sheep: `<ellipse cx="45" cy="55" rx="26" ry="18" fill="#F4EFE3"/><circle cx="20" cy="55" r="12" fill="#3a2b1a"/><circle cx="15" cy="52" r="2" fill="#fff"/><rect x="30" y="70" width="6" height="14" fill="#3a2b1a"/><rect x="55" y="70" width="6" height="14" fill="#3a2b1a"/>`,
  heart: `<path d="M50 82 C10 55 20 20 50 38 C80 20 90 55 50 82 Z" fill="#FF6FA5"/>`,
  fire: `<path d="M50 85 C25 85 20 60 35 45 C33 55 40 55 42 48 C44 60 60 55 55 40 C70 50 75 75 50 85 Z" fill="#FF9F43"/><path d="M50 80 C38 80 36 65 44 56 C44 62 50 62 50 55 C58 65 60 74 50 80 Z" fill="#FFC93C"/>`,
  mountain: `<path d="M10 80 L38 30 L55 55 L68 35 L90 80 Z" fill="#7f8c8d"/><path d="M38 30 L46 42 L30 42 Z" fill="#fff"/><path d="M68 35 L74 45 L62 45 Z" fill="#fff"/>`,
  scroll: `<rect x="25" y="30" width="50" height="40" rx="4" fill="#F4EFE3"/><rect x="20" y="30" width="10" height="40" rx="5" fill="#D4AF37"/><rect x="70" y="30" width="10" height="40" rx="5" fill="#D4AF37"/><line x1="35" y1="40" x2="65" y2="40" stroke="#8B5A2B" stroke-width="2"/><line x1="35" y1="50" x2="65" y2="50" stroke="#8B5A2B" stroke-width="2"/><line x1="35" y1="60" x2="60" y2="60" stroke="#8B5A2B" stroke-width="2"/>`,
  fish: `<path d="M20 50 Q45 25 75 50 Q45 75 20 50 Z" fill="#2E86DE"/><path d="M75 50 L90 38 L90 62 Z" fill="#1B6FC9"/><circle cx="32" cy="46" r="3" fill="#fff"/>`,
  star: `<polygon points="50,15 61,40 88,40 66,57 74,84 50,68 26,84 34,57 12,40 39,40" fill="#FFC93C"/>`,
  angel: `<circle cx="50" cy="32" r="12" fill="#F4EFE3"/><path d="M50 44 C25 44 20 80 50 88 C80 80 75 44 50 44 Z" fill="#fff"/><path d="M25 55 Q10 50 12 70 Q25 68 30 58 Z" fill="#FFE9A8"/><path d="M75 55 Q90 50 88 70 Q75 68 70 58 Z" fill="#FFE9A8"/><circle cx="50" cy="20" r="10" fill="none" stroke="#FFC93C" stroke-width="3"/>`
};
function kidIconSVG(key, size){
  const inner = KID_ICONS[key] || KID_ICONS.star;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${inner}</svg>`;
}

const GENESIS_STORY_PACK = [
  { title:'Creation of the Heavens and Earth', scripture:'Genesis 1', order:1, panels:[
    { icon:'sun', text:'In the beginning, God created the heavens and the earth. He spoke, and light appeared, and He called it day and night.' },
    { icon:'water', text:'God separated the sky from the seas and gathered the waters together, and dry land appeared.' },
    { icon:'tree', text:'God filled the earth with plants, trees, and every kind of fruit, and He saw that it was good.' },
    { icon:'star', text:'God made the sun, moon, and stars to light the sky and mark the days and seasons.' },
    { icon:'heart', text:'On the sixth day, God made every animal, and then He made man and woman in His own image, and He loved them.' },
  ]},
  { title:'The Garden of Eden', scripture:'Genesis 2', order:2, panels:[
    { icon:'tree', text:'God planted a beautiful garden in Eden and placed the first man, Adam, there to care for it.' },
    { icon:'water', text:'A river flowed through the garden, watering every tree, and the fruit was good to eat.' },
    { icon:'heart', text:'God said it was not good for man to be alone, so He made Eve to be his wife and helper.' },
    { icon:'sun', text:'Adam and Eve lived happily in the garden, walking and talking with God every day.' },
  ]},
  { title:'The Fall of Man', scripture:'Genesis 3', order:3, panels:[
    { icon:'tree', text:'God told Adam and Eve they could eat from every tree in the garden except one.' },
    { icon:'scroll', text:'A crafty serpent tricked Eve into doubting God\u2019s word, and she ate the forbidden fruit.' },
    { icon:'heart', text:'Adam ate too, and their eyes were opened. They felt ashamed and hid from God.' },
    { icon:'cross', text:'Though sin entered the world that day, God promised that one day a Savior would come to make things right.' },
  ]},
  { title:'Cain and Abel', scripture:'Genesis 4', order:4, panels:[
    { icon:'sheep', text:'Adam and Eve\u2019s sons, Cain and Abel, grew up and brought offerings to God. Abel brought his best lamb.' },
    { icon:'fire', text:'God was pleased with Abel\u2019s offering, but Cain\u2019s heart was not right, and God did not accept his.' },
    { icon:'heart', text:'Cain became angry and jealous, and in his anger, he hurt his brother Abel.' },
    { icon:'scroll', text:'God asked Cain where his brother was, showing us that God sees every heart and every deed.' },
  ]},
  { title:'The Tower of Babel', scripture:'Genesis 11', order:5, panels:[
    { icon:'mountain', text:'After the flood, all people spoke one language and lived together in one place.' },
    { icon:'crown', text:'The people decided to build a great tower to make a name for themselves, reaching toward the heavens.' },
    { icon:'fire', text:'God saw their pride and confused their language so they could no longer understand one another.' },
    { icon:'sun', text:'The people scattered across the whole earth, just as God had always planned for them to do.' },
  ]},
  { title:'Sodom and Gomorrah', scripture:'Genesis 18-19', order:6, panels:[
    { icon:'fire', text:'The cities of Sodom and Gomorrah were full of wickedness, and God decided to judge them.' },
    { icon:'heart', text:'Abraham pleaded with God to spare the cities if even a few righteous people could be found there.' },
    { icon:'angel', text:'Two angels came to rescue Lot and his family and led them safely out of the city.' },
    { icon:'fire', text:'God judged the cities, but Lot\u2019s family was saved because they trusted and obeyed.' },
  ]},
  { title:'Noah and the Ark', scripture:'Genesis 6-7', order:7, panels:[
    { icon:'heart', text:'The world had become full of sin and violence, but Noah found favor in the eyes of the Lord.' },
    { icon:'ark', text:'God told Noah to build a great ark to save his family and two of every kind of animal.' },
    { icon:'water', text:'Rain fell for forty days and nights, and the ark floated safely above the flood.' },
    { icon:'dove', text:'Noah sent out a dove, and when it returned with an olive leaf, he knew the waters were going down.' },
    { icon:'rainbow', text:'When they stepped onto dry land, God set a rainbow in the sky as His promise never to flood the whole earth again.' },
  ]},
  { title:'Noah and His Family', scripture:'Genesis 9-10', order:8, panels:[
    { icon:'heart', text:'After the flood, God blessed Noah and his family and told them to fill the earth once again.' },
    { icon:'rainbow', text:'God made a covenant with Noah, promising to never again destroy the earth with a flood.' },
    { icon:'tree', text:'Noah began to farm the land, and his sons Shem, Ham, and Japheth became the fathers of new nations.' },
    { icon:'sun', text:'From Noah\u2019s family, the whole earth was filled again with people, just as God had planned.' },
  ]},
  { title:'Abraham', scripture:'Genesis 12-22', order:9, panels:[
    { icon:'star', text:'God called Abraham to leave his home and promised to make him into a great nation.' },
    { icon:'tree', text:'Abraham obeyed, even though he did not know where God was leading him, and he trusted God\u2019s promise.' },
    { icon:'star', text:'God promised Abraham that his descendants would be as many as the stars in the sky.' },
    { icon:'heart', text:'Abraham became known as a friend of God because of his faith and obedience.' },
  ]},
  { title:'Isaac', scripture:'Genesis 21-27', order:10, panels:[
    { icon:'heart', text:'God kept His promise, and in their old age, Abraham and Sarah had a son named Isaac.' },
    { icon:'mountain', text:'God tested Abraham\u2019s faith by asking him to offer Isaac on a mountain, and Abraham obeyed in faith.' },
    { icon:'sheep', text:'At the last moment, God provided a ram to be offered instead, and Isaac\u2019s life was spared.' },
    { icon:'star', text:'Through Isaac, God\u2019s promise to Abraham continued, and his family became the beginning of a great nation.' },
  ]},
];
