/* ============================================================
   Ministry Wings data. TLYI uses the real submitted logo.
   The other six wings use tentative SVG marks in the FGO brand
   palette (navy/gold/crimson) — original vector marks drafted for
   King Fodan to approve, replace, or refine with real branding later.
   ============================================================ */

function wingBadge(inner){
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="47" fill="#0F1F35" stroke="#D4AF37" stroke-width="2.5"/>
    ${inner}
  </svg>`;
}

const WINGS = [
  {
    code: 'TLYI',
    name: 'The Living Youth International',
    logo: 'assets/images/tlyi-logo.png',
    desc: 'The youth arm of FGO — raising a generation on fire for God through discipleship, mentorship, creative arts, and bold evangelism.'
  },
  {
    code: 'CROP',
    name: "Children's Ministry",
    svg: wingBadge(`
      <circle cx="50" cy="34" r="14" fill="#D4AF37"/>
      <path d="M50 48 C30 48 24 68 24 80 L76 80 C76 68 70 48 50 48 Z" fill="#E9CE7A"/>
      <path d="M50 20 L52 26 L58 26 L53 30 L55 36 L50 32 L45 36 L47 30 L42 26 L48 26 Z" fill="#8E1B2B"/>
    `),
    desc: 'Sequential, graphical Bible teaching that plants faith early — nurturing children in the ways of God through story, song, and play.'
  },
  {
    code: 'OLDV',
    name: "Women's Ministry",
    svg: wingBadge(`
      <path d="M50 25 C40 25 32 33 32 43 C32 53 40 60 50 65 C60 60 68 53 68 43 C68 33 60 25 50 25 Z" fill="#D4AF37"/>
      <path d="M50 33 C46 33 42 37 42 43 C42 49 46 53 50 56 C54 53 58 49 58 43 C58 37 54 33 50 33 Z" fill="#0F1F35"/>
      <path d="M30 78 Q50 66 70 78" stroke="#E9CE7A" stroke-width="3" fill="none"/>
    `),
    desc: 'Strengthening women in faith, family, and purpose — building godly homes and mentoring the next generation of virtuous women.'
  },
  {
    code: 'TMII',
    name: "Men's Ministry",
    svg: wingBadge(`
      <path d="M50 22 L72 32 L72 52 C72 68 62 78 50 82 C38 78 28 68 28 52 L28 32 Z" fill="#D4AF37"/>
      <rect x="45" y="38" width="10" height="28" rx="2" fill="#0F1F35"/>
      <rect x="38" y="46" width="24" height="8" rx="2" fill="#0F1F35"/>
    `),
    desc: 'Raising men of integrity, spiritual leadership, and strength — equipped to lead their homes, workplaces, and communities for Christ.'
  },
  {
    code: 'TSM',
    name: 'Widows &amp; Orphanage Care',
    svg: wingBadge(`
      <path d="M50 76 C30 62 22 50 22 38 C22 28 30 22 38 22 C44 22 48 26 50 30 C52 26 56 22 62 22 C70 22 78 28 78 38 C78 50 70 62 50 76 Z" fill="#8E1B2B"/>
      <path d="M50 76 C30 62 22 50 22 38 C22 28 30 22 38 22 C44 22 48 26 50 30 C52 26 56 22 62 22 C70 22 78 28 78 38 C78 50 70 62 50 76 Z" fill="none" stroke="#E9CE7A" stroke-width="2"/>
    `),
    desc: 'Practical compassion in action — caring for widows and orphaned children with material support, love, and spiritual covering.'
  },
  {
    code: 'TSAM',
    name: 'Elderly Ministry',
    svg: wingBadge(`
      <path d="M28 68 L28 45 L40 32 L60 32 L72 45 L72 68 Z" fill="#0F1F35" stroke="#D4AF37" stroke-width="2"/>
      <circle cx="50" cy="30" r="8" fill="#D4AF37"/>
      <rect x="45" y="50" width="10" height="18" fill="#D4AF37"/>
    `),
    desc: 'Honouring the elderly with dignity, fellowship, and care — drawing on a lifetime of wisdom to bless the whole church family.'
  },
  {
    code: 'KAP',
    name: 'Community Development',
    svg: wingBadge(`
      <circle cx="50" cy="48" r="22" fill="none" stroke="#D4AF37" stroke-width="3"/>
      <path d="M28 48 L72 48 M50 26 L50 70 M35 34 Q50 44 65 34 M35 62 Q50 52 65 62" stroke="#D4AF37" stroke-width="1.5" fill="none"/>
      <circle cx="50" cy="48" r="6" fill="#E9CE7A"/>
    `),
    desc: 'Serving beyond the four walls of the church — community outreach, skills empowerment, and social impact projects that reflect the love of Christ.'
  }
];
