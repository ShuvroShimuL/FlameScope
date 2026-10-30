/* Editorial timing is shared by the player, render and narration export. */
globalThis.POLARIS_FILM = {
  title: 'Will It Burn? — Team Polaris',
  width: 1920, height: 1080, fps: 30, duration: 240,
  team: [
    ['Shamimul Shimul', 'Team lead', 'SS'],
    ['Soleman Hossain', 'Product lead', 'SH'],
    ['Iman Ahamad', 'Computer vision developer', 'IA'],
    ['Sara Rahman', 'Scientific researcher', 'SR'],
    ['Sihab Mahmud', 'Tech development and design', 'SM'],
    ['Faisal Mahmud Abir', 'AI engineer', 'FA']
  ],
  scenes: [
    { id:'hook', start:0, end:12, title:'The question', chapter:'A QUESTION WORTH ASKING',
      voice:'A fire starts inside a spacecraft. The crew needs more than a guess. Before applying a test result, one question matters: does the evidence cover these conditions?' },
    { id:'brand', start:12, end:22, title:'Team Polaris', chapter:'MEET THE TEAM',
      voice:'We are Team Polaris, from Dhaka, Bangladesh. Inspired by the North Star, we want to help explorers find direction through evidence.' },
    { id:'team', start:22, end:48, title:'All six members', chapter:'MEET THE TEAM',
      voice:'Our team is Shamimul Shimul, team lead; Soleman Hossain, product lead; Iman Ahamad, computer vision developer; Sara Rahman, scientific researcher; Sihab Mahmud, tech development and design; and Faisal Mahmud Abir, AI engineer. Together, we bring research, product thinking, design, and engineering to the same question.' },
    { id:'problem', start:48, end:65, title:'The problem', chapter:'THE PROBLEM',
      voice:'NASA has already studied how materials burn in microgravity. But the evidence lives across technical reports and experimental tables. Finding a result is only the beginning. Understanding where that result applies is the harder task.' },
    { id:'conditions', start:65, end:82, title:'Conditions matter', chapter:'THE PROBLEM',
      voice:'A material name alone cannot describe a spacecraft cabin. Gravity, oxygen, pressure, airflow, and sample dimensions all matter when checking the evidence. If a test did not record the conditions you asked about, that gap must stay visible.' },
    { id:'challenge', start:82, end:102, title:'Flame in Freefall', chapter:'THE CHALLENGE',
      voice:'Our challenge is Flame in Freefall: AI-Powered Fire Safety Insights from Microgravity Combustion Data. Our concept is a way to summarize NASA findings, rank patterns in the evidence, and interpret what the tests can actually tell us.' },
    { id:'ask', start:102, end:118, title:'Ask a cabin question', chapter:'OUR SOLUTION APPROACH',
      voice:'Introducing Will It Burn?, the front door to FlameScope. Start with a plain-English question, such as: will acrylic burn on the Space Station? The concept brings the question, the recorded conditions, and the supporting evidence into one clear view.' },
    { id:'match', start:118, end:136, title:'Match the whole question', chapter:'OUR SOLUTION APPROACH',
      voice:'First, read the question into explicit conditions. Then check them against NASA test records. A test counts only when its own row records every condition requested, together. We do not combine separate tests to create a match that never happened.' },
    { id:'answer', start:136, end:154, title:'Show a sourced answer', chapter:'OUR SOLUTION APPROACH',
      voice:'For the broad acrylic question, the BASS-II table records twenty acrylic sheets that burned. The answer is Burned, tied to those tests. Each result should lead back to its source, so the user can inspect the evidence behind the answer.' },
    { id:'gap', start:154, end:174, title:'Make the gap visible', chapter:'OUR SOLUTION APPROACH',
      voice:'Now change the question to a Moon base. These BASS-II tests did not record lunar gravity. The answer becomes No data for that scenario. The interface explains the missing condition and shows nearby evidence, while keeping the gap in view.' },
    { id:'source', start:174, end:190, title:'Keep the source attached', chapter:'OUR SOLUTION APPROACH',
      voice:'The source is part of the answer. A report, a table, and a test row travel with each result. Missing values remain missing. That lets a researcher follow the reasoning and decide what needs to be checked next.' },
    { id:'suite', start:190, end:208, title:'A workspace for evidence', chapter:'PLANNED CONCEPT MODULES',
      voice:'The wider concept brings four modules together: a source-linked ChatBot, an analysis tool, side-by-side comparison, and FlameViz to visualize recorded measurements. These planned modules share one purpose: make NASA evidence easier to explore, compare, and understand.' },
    { id:'trust', start:208, end:224, title:'A clear role for AI', chapter:'THE DESIGN PRINCIPLE',
      voice:'AI has a deliberately limited role: select relevant evidence, or abstain. The evidence engine computes the numbers and verdicts. Our aim is to help researchers ask better questions, inspect the support, and see where more testing is needed.' },
    { id:'close', start:224, end:234, title:'Direction through evidence', chapter:'TEAM POLARIS',
      voice:'Will It Burn?, by Team Polaris. A clear question. A traceable answer. An honest gap. Our concept for Flame in Freefall.' },
    { id:'credits', start:234, end:240, title:'Sources and credits', chapter:'SOURCES & CREDITS', voice:'' }
  ]
};
