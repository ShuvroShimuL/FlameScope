# NASA Space Apps 2026 — আমাদের Team Preparation 🚀

আমরা North South University-এর recent CSE graduates। আমাদের লক্ষ্য এমন একটা **Advanced challenge** বেছে নেওয়া, যেখানে আমাদের Coding, Data Analysis, Software Development আর problem-solving skills ভালোভাবে কাজে লাগবে।

এই README-টা ১৮ সেপ্টেম্বর ২০২৬-এ দেখা challenge summaries আর আগের research-এর ভিত্তিতে তৈরি। এখানে NASA-এর official তথ্য, আমাদের জন্য recommendation, আর proposed project ideas আলাদা করে বোঝানো হয়েছে। কোনো challenge এখনো team হিসেবে final করা হয়নি।

## আগে গুরুত্বপূর্ণ বিষয়টা বুঝে নিই

NASA-এর ২০২৬ catalog-এ মোট **১৪টা challenge**, যার মধ্যে **৮টায় Advanced tag** আছে। এর মধ্যে **২টা শুধু Advanced**, বাকিগুলোতে Advanced-এর পাশাপাশি অন্য difficulty level-ও আছে।

১৭ সেপ্টেম্বর **challenge summaries** প্রকাশ হয়েছে। আমাদের দেওয়া Participant Guide অনুযায়ী **full challenge statements আসবে ২৮ অক্টোবর**। তাই এখন একটা working direction বেছে নেব, আর full statement এলে requirements মিলিয়ে নেব।

**শুধু কঠিন challenge বেছে নিলেই ভালো project হবে না।** আমাদের দেখতে হবে—Dataset পাওয়া যাচ্ছে কি না, result verify করা যাবে কি না, আর একটা ছোট কিন্তু convincing demo বানানো সম্ভব কি না।

Source: [Official Challenge List](https://www.spaceappschallenge.org/2026/challenges/) · [Participant Guide](https://docs.google.com/document/d/1mSOxplyht5kii8GcCnFaGA-vMHIAVypjl4N6PobnaYQ/edit)

## আমাদের জন্য কোন challenge আগে দেখব?

নিচের **difficulty tags NASA-এর**, কিন্তু **ranking আমাদের CSE background ধরে করা recommendation**। এখানে ধরে নেওয়া হয়েছে যে আমাদের general Software Development experience আছে, কিন্তু বিশেষভাবে Astronomy বা Remote Sensing expertise নিশ্চিত নয়।

| Priority | Challenge | Official difficulty | সহজভাবে NASA কী চাইছে? | কোথায় বেশি কাজ লাগবে? |
|---|---|---|---|---|
| **1** | [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/be-an-earth-system-trend-detective/) | **Advanced only** | NASA-এর environmental variables সময়ের সঙ্গে কোথায়, কতটা বদলাচ্ছে এবং পরিবর্তনটা statistically significant কি না দেখানো। | Time-series analysis, missing data, seasonality, uncertainty। |
| **2** | [Flame in Freefall](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall-ai-powered-fire-safety-insights-from-microgravity-combustion-data/) | Advanced + Intermediate | Microgravity-তে আগুন নিয়ে হওয়া experiments-এর findings summarize, rank আর explain করার AI dashboard। | Scientific evidence extract করা, experiment compare করা, AI-এর unsupported claims ঠেকানো। |
| **3** | [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/) | Advanced + Intermediate | আলাদা satellite sensor-এর fire records মিলিয়ে useful burning-activity calendar তৈরি। | Sensor differences handle করা এবং harmonized result validate করা। |
| **4** | [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/) | Advanced + Intermediate | NASA observations, local soil, crop information আর farmer priorities দিয়ে crop rotation explore করার tool। | Agriculture knowledge, local data, recommendation-এর scientific basis। |
| **5** | [CLPS Lunar Mission Browser](https://www.spaceappschallenge.org/2026/challenges/clps-lunar-mission-browser/) | Advanced + Intermediate | Moon-এর landing site আর date compare করে sunlight ও Earth communication windows দেখানো। | Coordinate systems, terrain horizon, visibility calculation। |
| **6** | [Dancing with the SARs](https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/) | Advanced + Intermediate | **NISAR** radar data দিয়ে Earth surface-এর পরিবর্তন track ও visualize করা। | Radar preprocessing, usable repeat observations, change interpretation। |
| **7** | [Planet X and SPHEREx](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/) | **Advanced only** | SPHEREx sky images সময়ের সঙ্গে কীভাবে বদলাচ্ছে, সেটা সাধারণ মানুষকে explore করতে দেওয়া। | Image alignment, astronomical coordinates, real movement আর artifacts আলাদা করা। |
| **8** | [Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars](https://www.spaceappschallenge.org/2026/challenges/identify-earth-locations-that-analog-the-permanent-moon-base-locations-and-mars/) | Advanced + Intermediate + Beginner/Youth | পৃথিবীর এমন জায়গা খুঁজে characterize করা, যেগুলোর কিছু বৈশিষ্ট্য Moon বা Mars-এর site-এর মতো। | কোন বৈশিষ্ট্যে similarity মাপব এবং সেটা scientifically defend করব কীভাবে। |

**আমরা যদি শুধু Advanced-only challenge চাই**, তাহলে choices হলো **Earth System Trend Detective** আর **Planet X and SPHEREx**। অন্য ছয়টাও official Advanced filter-এর মধ্যে আছে।

## আমার recommendation: Earth System Trend Detective

এটা আমাদের জন্য ভালো starting choice হতে পারে। এখানে Data Engineering, Statistics, Backend, Frontend আর Visualization—সব জায়গায় meaningful contribution করা যাবে। Bangladesh-এর একটা case study দিয়ে problem-টা বোঝানোও সহজ হতে পারে।

তবে এটাকে শুধু একটা সুন্দর chart বা map বানানোর project ভাবলে হবে না। আসল কাজ হলো **পরিবর্তন কতটা হচ্ছে এবং সেই conclusion কতটা reliable—সেটা বুঝিয়ে দেওয়া**।

### Proposed idea: “DeltaLens”

নামটা আপাতত working name। এটা NASA-এর দেওয়া project name বা requirement নয়।

ধরি, একজন user জানতে চায়: “আমার বেছে নেওয়া এলাকায় rainfall বা temperature-এর long-term trend কেমন?”

আমাদের app-এ user:

1. একটা region বেছে নেবে।
2. একটা environmental variable আর time range বেছে নেবে।
3. Trend chart এবং পরিবর্তনের পরিমাণ দেখবে।
4. Result-এর uncertainty এবং data limitations বুঝতে পারবে।
5. চাইলে আরেকটা region-এর সঙ্গে compare করবে।

**প্রথম MVP:** একটা variable, একটা Bangladesh case study, একটা trend chart, uncertainty explanation, আর source information। MVP মানে সবচেয়ে ছোট version, যেটা দিয়ে মূল idea-টা কাজ করে দেখানো যায়।

আমাদের starting research sources:

- [NASA Giovanni](https://giovanni.earthdata.nasa.gov/): Rainfall, soil moisture, temperature-এর মতো geophysical measurements নিয়ে map ও time-series analysis করা যায়। Earthdata login লাগতে পারে।
- [Earthdata Search](https://search.earthdata.nasa.gov/): Relevant Dataset, time coverage আর geographic coverage খোঁজার জায়গা।

**এখনো যাচাই বাকি:** আমাদের নির্দিষ্ট region, variable ও time range-এর জন্য usable sample পাওয়া যাবে কি না। শুধু portal পাওয়া মানেই project-এর Dataset ready নয়।

### Meeting-এ এই pitch-টা বলা যায়

> Environmental change-এর chart দেখা সহজ, কিন্তু সেই change কতটা reliable সেটা বোঝা কঠিন। DeltaLens দিয়ে আমরা NASA data ব্যবহার করে দেখাতে চাই—কোথায় কী বদলাচ্ছে, কতটা বদলাচ্ছে, আর result নিয়ে কতটা confident হওয়া যায়। শুরু করব একটা variable আর Bangladesh-এর একটা case study দিয়ে।

### কী করলে আলাদা লাগতে পারে?

- শুধু trend line না দেখিয়ে uncertainty বোঝানো।
- Time range বদলালে conclusion বদলায় কি না দেখানো।
- Seasonal pattern আর long-term trend আলাদা করে explain করা।
- Result-এর পাশে Dataset, units, method আর limitations রাখা।

এখনই forecasting বা “কেন এই change হচ্ছে” এমন causal claim করার commitment দেব না। Trend পাওয়া আর ভবিষ্যৎ predict করা বা কারণ প্রমাণ করা আলাদা কাজ।

## Vote-এর জন্য আরও দুইটা strong option

### Option 2: Flame in Freefall → “FlameScope”

যদি team-এর AI/NLP এবং information extraction-এ বেশি interest থাকে, এটা ভালো candidate।

**Idea:** User experiment-এর material ও conditions দেখে findings compare করতে পারবে। AI summary-এর প্রতিটা important claim-এর সঙ্গে source evidence থাকবে।

**ছোট demo:** অল্প কয়েকটা experiment নিয়ে comparison table, evidence-linked summary, আর filter।

**Data research:** [NASA Physical Sciences Informatics](https://science.data.nasa.gov/features-events/psi-spotlight) এবং [BASS-II investigation](https://psi.nasa.gov/physci/repo/data/investigations/PSI-25)।

**প্রথম check:** Experiments-এর fields, units আর conditions আসলেই compare করা যায় কি না। AI dashboard-এ scientific findings explain করব; unsupported fire-safety advice দেব না।

### Option 3: Hot Spots Harmonization → “FireCalendar”

যদি Data Engineering আর geospatial analysis বেশি ভালো লাগে, এটা দেখব।

**Idea:** একটা region-এর historical fire activity calendar, যেখানে raw MODIS/VIIRS records আর harmonized output-এর পার্থক্য বোঝা যাবে।

**ছোট demo:** একটা region, overlapping observations, raw বনাম harmonized comparison, seasonal calendar।

**Data research:** NASA FIRMS। Historical standard products-এর জন্য API access route আছে—[FIRMS support explanation](https://forum.earthdata.nasa.gov/viewtopic.php?t=7428)।

**প্রথম check:** Overlapping data পাওয়া যায় কি না এবং harmonization ভালো হয়েছে সেটা কীভাবে মাপব। দুইটা CSV জোড়া লাগালেই এই challenge solve হবে না।

## আজকের Meeting Agenda — ৯০ মিনিট

**Meeting date:** শুক্রবার, ১৮ সেপ্টেম্বর ২০২৬।

Meeting-এর আগে সবাই এই shortlist দেখে আসব। প্রত্যেকে আনব: **একটা top choice, একটা source link, একটা demo idea, আর একটা বড় risk**।

| সময় | Agenda | কী করব? | শেষে কী থাকতে হবে? |
|---|---|---|---|
| **০–২৫ মিনিট** | **1. Pitch & Vote** | প্রত্যেকে ২ মিনিটে নিজের choice explain করব। আলাদাভাবে score দেব, top দুইটা নিয়ে আলোচনা করব, তারপর vote। | একটা working challenge এবং কেন বেছে নিলাম তার কারণ। |
| **২৫–৪৫ মিনিট** | **2. Deconstruct the Challenge** | NASA কী output চাইছে, user কে, input কী, কী করলে success বলব—লিখব। | এক লাইনের problem statement, candidate Dataset list, unanswered questions। |
| **৪৫–৬৫ মিনিট** | **3. Initial Solution Brainstorm** | আগে ৫ মিনিট সবাই নিজের idea sketch করব। তারপর strongest parts এক করব। | একটা user journey এবং তিনটা essential feature। |
| **৬৫–৮০ মিনিট** | **4. Stress-Test the Idea** | Data access, scientific validity, novelty আর demo feasibility নিয়ে tough questions করব। | তিনটা বড় risk, প্রতিটার test এবং owner। |
| **৮০–৯০ মিনিট** | **5. Assign Action Items** | প্রতিটা task-এর একজন accountable owner আর clear deliverable ঠিক করব। | Saturday task board এবং review time। |

### Vote কীভাবে দেব?

এটা **আমাদের challenge selection rubric**, official judging score নয়। সবাই প্রতিটা criterion-এ ১–৫ score দেব।

| Criterion | Weight |
|---|---:|
| Challenge-এর সঙ্গে idea কতটা সরাসরি মিলে | 25% |
| Dataset access ও usability | 25% |
| ছোট, convincing demo বানানো সম্ভব | 20% |
| নির্দিষ্ট user-এর জন্য আলাদা value | 15% |
| Team-এর skills এবং interest | 15% |

**Calculation:** প্রতিটা criterion-এর `weight × score ÷ 5`, তারপর সব যোগ। Total 100-এর মধ্যে হবে।

Data access যাচাই না হলে “পাওয়া যাবে নিশ্চয়ই” ধরে high score দেব না। Unknown হিসেবে লিখব। একই score হলে আগে usable data এবং clear validation-এর option-টা গুরুত্ব দেব।

### Challenge deconstruct করার template

```text
Official challenge name:
Official URL:
NASA কী output চাইছে:
আমাদের target user:
User-এর নির্দিষ্ট problem:
Candidate Dataset / API:
আমাদের proposed output:
কীভাবে result verify করব:
Full statement আসা পর্যন্ত কী unknown আছে:
```

### Idea stress-test করার questions

- NASA data থেকে useful output পর্যন্ত পুরো flow দেখাতে পারব?
- Result ঠিক কি না বোঝার reference বা baseline কী?
- Existing tool-এর চেয়ে user বাড়তি কী সুবিধা পাবে?
- ৬০ সেকেন্ডের demo-তে সবচেয়ে গুরুত্বপূর্ণ contribution দেখানো যাবে?
- কোন feature বাদ দিলেও challenge-এর মূল requirement পূরণ হবে?
- Live API fail করলে documented cached sample দিয়ে demo চলবে?
- আমাদের কোনো claim কি available evidence-এর চেয়ে বড় হয়ে যাচ্ছে?

## Saturday Action Items — ১৯ সেপ্টেম্বর

Suggested review time: **রাত ৮টা, Bangladesh time**। Meeting-এ সুবিধামতো final করব। নিচেরগুলো role; team size কম হলে একজন একাধিক role নিতে পারে।

| Owner / Role | কাজ | Concrete deliverable |
|---|---|---|
| **Team Lead** | Decision record, registration status, deadline confusion resolve করা। | এক পাতার decision log এবং verified milestone list। |
| **Data Researcher** | Candidate Dataset-এর access ও suitability দেখা। | Source, variable, units, coverage, resolution, access method এবং sample availability-সহ inventory। |
| **Science / Statistics Researcher** | Method, assumptions আর baseline research। | References-সহ এক পাতার validation plan এবং failure cases। |
| **Technical Lead** | Processing, storage, API ও deployment needs বোঝা। | Architecture sketch এবং সবচেয়ে risky dependency-এর estimate। |
| **UX / Design Owner** | User এবং core interaction পরিষ্কার করা। | তিনটা screen-এর storyboard: input → result → explanation। |
| **Pitch / Research Owner** | Existing tools compare করা এবং presentation structure দেখা। | তিনটা comparable tool, আমাদের meaningful difference, ৬০ সেকেন্ডের concept script। |

Saturday-এর লক্ষ্য হলো idea-টা বাস্তবে করা সম্ভব কি না বোঝা। Event-এর আগে কোন ধরনের preparation বা implementation allowed, সেটা Team Lead current rules/Local Lead থেকে নিশ্চিত করবে।

## Google Drive-এ কোন জিনিস কোথায় রাখব?

আমাদের [Team Drive](https://drive.google.com/drive/folders/1CARzGLr1drf16eR8vgD2uhgh0Pu3XFpp)-এ এই folders আছে। নিচের mapping অনুযায়ী গুছিয়ে রাখতে পারি:

| Folder | কী রাখব? |
|---|---|
| **Code & Documentation** | Decision log, architecture, meeting notes, repository link। |
| **NASA Datasets** | Dataset inventory, source links, data dictionary, access notes। |
| **Pitch Video & Script** | Concept script, storyboard, presentation draft। |
| **Resources** | Papers, tutorials, competitor research, official guidance। |

প্রতিটা task-এর format রাখব:

```text
Task:
Owner:
Deadline:
Deliverable link:
Status: Not started / In progress / Blocked / Done
Blocker বা next step:
```

## Dates আর submission নিয়ে এখনই যা খেয়াল রাখতে হবে

| বিষয় | এখন পাওয়া তথ্য |
|---|---|
| Challenge summaries | ১৭ সেপ্টেম্বর ২০২৬ প্রকাশ হয়েছে। |
| Bangladesh registration | Local portal-এ closing date **১ অক্টোবর ২০২৬**। |
| Prescreening video | Guide অনুযায়ী **১ অক্টোবর, রাত ১১:৫৯**, maximum **২৪০ seconds**। |
| Full challenge statements | Guide অনুযায়ী **২৮ অক্টোবর ২০২৬**। |
| Bangladesh hackathon | **১৩–১৪ নভেম্বর ২০২৬**। |
| Global hackathon | **১৪–১৫ নভেম্বর ২০২৬**। |

**Bangladesh registration আর NASA registration আলাদা।** Local participation আর global submission-এর জন্য দুটোর status-ই check করব।

**Guide-এ কিছু deadline conflict আছে:** local judging video-এর জন্য এক জায়গায় **১ নভেম্বর**, আবার event schedule-এ **১৩ নভেম্বর** আছে। Final video-এর ক্ষেত্রেও **১৪ নভেম্বর সকাল ৯টা** এবং **দুপুর ১২টা**—দুই সময় আছে। Team Lead Local Lead-এর কাছ থেকে সঠিক deadline নিশ্চিত করে decision log-এ রাখবে।

Source: [Bangladesh Portal](https://nasaspaceappsbd.com/) · [Participant Guide](https://docs.google.com/document/d/1mSOxplyht5kii8GcCnFaGA-vMHIAVypjl4N6PobnaYQ/edit) · [NASA Global Site](https://www.spaceappschallenge.org/)

## Resource videos কীভাবে ব্যবহার করব?

আমাদের দেওয়া playlist-এর title **“2023: NASA Space Apps Challenge Bangladesh”**। তাই এগুলো দিয়ে presentation flow, problem explanation আর demo storytelling-এর উদাহরণ দেখব। **২০২৬-এর rules বা deadline জানতে এই পুরোনো videos-এর ওপর নির্ভর করব না।**

[Resource Playlist](https://www.youtube.com/playlist?list=PLJUydULoWIuWx48oCTPGeoqkF4OMUkV0K)

ভিডিও দেখার সময় note করতে পারি:

- Problem কত দ্রুত বোঝানো হয়েছে?
- NASA data-এর ভূমিকা পরিষ্কার কি না?
- Demo দেখে solution-এর value বোঝা যায় কি না?
- কোন অংশ আমরা আরও পরিষ্কারভাবে explain করতে পারতাম?

## Meeting শেষে আমাদের decision record

```text
আমরা যে challenge বেছে নিয়েছি:
কেন এটা বেছে নিয়েছি:
আমাদের target user:
আমাদের core idea:
যে Dataset/API investigate করব:
MVP-এর তিনটা essential feature:
সবচেয়ে বড় তিনটা risk:
Saturday task owners:
Next review time:
Full statement এলে যে assumptions আবার check করব:
```

সবাই যেন meeting শেষে নিজের ভাষায় বলতে পারি:

> আমরা ___ user-এর ___ problem solve করছি। এজন্য ___ Dataset ব্যবহার করব। আমাদের demo দিয়ে দেখাব যে ___ কাজটা করা সম্ভব।

## সব গুরুত্বপূর্ণ links এক জায়গায়

- [BD Local Portal](https://nasaspaceappsbd.com/)
- [NASA Global Site](https://www.spaceappschallenge.org/)
- [2026 Challenges](https://www.spaceappschallenge.org/2026/challenges/)
- [Team Google Drive](https://drive.google.com/drive/folders/1CARzGLr1drf16eR8vgD2uhgh0Pu3XFpp?usp=sharing)
- [Participant Guide](https://docs.google.com/document/d/1mSOxplyht5kii8GcCnFaGA-vMHIAVypjl4N6PobnaYQ/edit?tab=t.0)
- [Resource Videos — 2023 Playlist](https://www.youtube.com/playlist?list=PLJUydULoWIuWx48oCTPGeoqkF4OMUkV0K)

---

*এটা আমাদের preparation note। Ranking, project names, MVP scope এবং meeting rubric হলো suggestions। Official requirements ও deadlines-এর জন্য current NASA guidance এবং Bangladesh Local Lead-এর confirmation অনুসরণ করব।*
