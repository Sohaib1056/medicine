// Roman Urdu to Urdu transliteration dictionary
// Maps common Roman Urdu words/phrases to their Urdu equivalents

export const urduDictionary: Record<string, string> = {
  // Numbers
  'aik': 'ایک',
  'ek': 'ایک',
  'do': 'دو',
  'teen': 'تین',
  'char': 'چار',
  'paanch': 'پانچ',
  'cheh': 'چھ',
  'saat': 'سات',
  'aath': 'آٹھ',
  'nau': 'نو',
  'das': 'دس',
  'gyarah': 'گیارہ',
  'barah': 'بارہ',
  'terah': 'تیرہ',
  'chodah': 'چودہ',
  'pandrah': 'پندرہ',
  'solah': 'سولہ',
  'satarah': 'سترہ',
  'atharah': 'اٹھارہ',
  'unes': 'انیس',
  'bees': 'بیس',

  // Time/Duration
  'din': 'دن',
  'dino': 'دنوں',
  'raat': 'رات',
  'raaton': 'راتوں',
  'hafta': 'ہفتہ',
  'haftay': 'ہفتے',
  'maheena': 'مہینہ',
  'maheenay': 'مہینے',
  'saal': 'سال',
  'saalon': 'سالوں',
  'ghanta': 'گھنٹہ',
  'ghantay': 'گھنٹے',
  'minute': 'منٹ',
  'minut': 'منٹ',
  'dafa': 'دفعہ',
  'dafaa': 'دفعہ',
  'dafaan': 'دفعاں',
  'martaba': 'مرتبہ',
  'martabah': 'مرتبہ',
  'bar': 'بار',

  // Frequency
  'roz': 'روز',
  'daily': 'روزانہ',
  'rozana': 'روزانہ',
  'har': 'ہر',
  'subah': 'صبح',
  'shaam': 'شام',
  'dopahar': 'دوپہر',
  'raatko': 'رات کو',
  'sotewaqt': 'سوتے وقت',
  'sotay': 'سوتے',
  'waqt': 'وقت',
  'sote': 'سوتے',
  'sotaywaqt': 'سوتے وقت',

  // Meals
  'khana': 'کھانا',
  'khane': 'کھانے',
  'khanay': 'کھانے',
  'khaneke': 'کھانے کے',
  'khanayke': 'کھانے کے',
  'khanekebaad': 'کھانے کے بعد',
  'khanaykebaad': 'کھانے کے بعد',
  'khanesepehle': 'کھانے سے پہلے',
  'bhojan': 'بھوجن',
  'bhojanke': 'بھوجن کے',
  'bhojankebaad': 'بھوجن کے بعد',
  'bhojansepahle': 'بھوجن سے پہلے',
  'nashta': 'ناشتہ',
  'nashtayke': 'ناشتے کے',
  'nashtaykebaad': 'ناشتے کے بعد',
  'doodh': 'دودھ',
  'doodhke': 'دودھ کے',
  'doodhkebaad': 'دودھ کے بعد',
  'pani': 'پانی',
  'panike': 'پانی کے',
  'panikesath': 'پانی کے ساتھ',

  // Prepositions/Connectors
  'ke': 'کے',
  'kay': 'کے',
  'ka': 'کا',
  'ki': 'کی',
  'ko': 'کو',
  'mein': 'میں',
  'me': 'میں',
  'main': 'میں',
  'se': 'سے',
  'say': 'سے',
  'par': 'پر',
  'tak': 'تک',
  'liye': 'لیئے',
  'liya': 'لیا',
  'waste': 'واسطے',

  // Common medical terms
  'dard': 'درد',
  'dardmein': 'درد میں',
  'dardke': 'درد کے',
  'bukhar': 'بخار',
  'bukharmein': 'بخار میں',
  'khansi': 'کھانسی',
  'khansimein': 'کھانسی میں',
  'zukam': 'زکام',
  'zukammein': 'زکام میں',
  'bechaini': 'بے چینی',
  'bechainimein': 'بے چینی میں',
  'qabz': 'قبض',
  'qabzmein': 'قبض میں',
  'pet': 'پیٹ',
  'petmein': 'پیٹ میں',
  'petkedard': 'پیٹ کے درد',
  'sar': 'سر',
  'sardard': 'سر درد',
  'sarmerdard': 'سر میں درد',

  // Directions
  'pahle': 'پہلے',
  'pehle': 'پہلے',
  'pehly': 'پہلے',
  'baad': 'بعد',
  'bad': 'بعد',
  'meinbaad': 'میں بعد',
  'meinpehle': 'میں پہلے',
  'sepehle': 'سے پہلے',
  'sebaad': 'سے بعد',
  'kebaad': 'کے بعد',
  'kepehle': 'کے پہلے',
  'kepahle': 'کے پہلے',

  // Route/Administration
  'munh': 'منہ',
  'munhse': 'منہ سے',
  'zuban': 'زبان',
  'zubanke': 'زبان کے',
  'zubanke niche': 'زبان کے نیچے',
  'niche': 'نیچے',
  'neeche': 'نیچے',
  'aankh': 'آنکھ',
  'aankhon': 'آنکھوں',
  'aankhonmein': 'آنکھوں میں',
  'kaan': 'کان',
  'kaanmein': 'کان میں',
  'naak': 'ناک',
  'naakmein': 'ناک میں',
  'galay': 'گلے',
  'galaymein': 'گلے میں',
  'jild': 'جلد',
  'jildpar': 'جلد پر',
  'jildpe': 'جلد پے',
  'gardan': 'گردن',
  'gardanpar': 'گردن پر',

  // Days
  ' Alternate': 'ایک دن چھوڑ کر',
  'alternate': 'ایک دن چھوڑ کر',
  'ekdinchodkar': 'ایک دن چھوڑ کر',
  'chodkar': 'چھوڑ کر',

  // Quantity
  'tablet': 'ٹیکٹ',
  'tablets': 'ٹیکٹ',
  'goli': 'گولی',
  'golia': 'گولی',
  'golian': 'گولیاں',
  'capsule': 'کیپسول',
  'capsules': 'کیپسول',
  'sharbat': 'شربت',
  'drops': 'قطرے',
  'drop': 'قطرہ',
  'qatra': 'قطرہ',
  'qatray': 'قطرے',
  'injection': 'انجکشن',
  'malham': 'مرہم',
  'cream': 'کریم',
  'syrup': 'شربت',
  'syp': 'شربت',
  'powder': 'پاؤڈر',

  // Kitchen/Utensils
  'chamach': 'چمچ',
  'chammach': 'چمچ',
  'chamcha': 'چمچہ',
  'chammacha': 'چمچہ',
  'piyala': 'پیالہ',
  'glass': 'گلاس',
  'botal': 'بوتل',
  'bottle': 'بوتل',
  'katori': 'کٹوری',
  'plate': 'پلیٹ',
  'bara': 'برتن',

  // Instructions
  'sath': 'ساتھ',
  'garam': 'گرم',
  'thanda': 'ٹھنڈا',
  'garampani': 'گرم پانی',
  'thandepani': 'ٹھنڈے پانی',
  'thandapani': 'ٹھنڈا پانی',
  'sathle': 'ساتھ لے',
  'sathlen': 'ساتھ لیں',
  'jald': 'جلد',
  'aram': 'آرام',
  'arammilega': 'آرام ملے گا',
  'araham': 'آرام',
  'tez': 'تیز',
  'dheema': 'دھیما',
  'halqah': 'ہلکا',
  'tezi': 'تیزی',
  'kam': 'کم',
  'zyada': 'زیادہ',
  'zyadah': 'زیادہ',
  'bohat': 'بہت',
  'thora': 'تھوڑا',

  // More common words
  'agar': 'اگر',
  'jaroorat': 'ضرورت',
  'ho': 'ہو',
  'to': 'تو',
  'hojaye': 'ہو جائے',
  'hojain': 'ہو جائیں',
  'len': 'لیں',
  'lijiye': 'لیجیئے',
  'na': 'نہ',
  'naleo': 'نہ لیں',
  'naain': 'نہیں',
  'nahi': 'نہیں',
  'bina': 'بغیر',
  'sirf': 'صرف',
  'sirfaur': 'صرف اور',
  'sirfaurkuch': 'صرف اور کچھ',
  'aur': 'اور',
  'kuch': 'کچھ',
  'kuchnahe': 'کچھ نہیں',
  'nahn': 'نہیں',
  'nahnlen': 'نہیں لیں',

  // Common phrases
  'asdirected': 'جیسا بتایا گیا',
  'asdirection': 'جیسا بتایا گیا',
  'jesabtayagya': 'جیسا بتایا گیا',
  'dawaikhsay': 'دائی کے ساتھ',
  'tabdeel': 'تبدیل',
  'tabdeelkarein': 'تبدیل کریں',
  'rukawat': 'رکاوٹ',
  'jari': 'جاری',
  'jaarirakhain': 'جاری رکھیں',
  'ruknahe': 'رک نہیں',
  'rukain': 'رکیں',

  // Times per day
  'oneday': 'ایک دن',
  'twiceaday': 'دو بار',
  'thriceaday': 'تین بار',
  'fourtimesaday': 'چار بار',
  'every6hours': 'ہر 6 گھنٹے',
  'every8hours': 'ہر 8 گھنٹے',
  'every12hours': 'ہر 12 گھنٹے',
  'everyotherday': 'ایک دن چھوڑ کر',

  // Special instructions
  'completecourse': 'مکمل کورس',
  'pooracourse': 'پورا کورس',
  'adhuranahe': 'ادھورا نہیں',
  'adhuranahchoren': 'ادھورا نہ چھوڑیں',
  'bilkul': 'بالکل',
  'theek': 'ٹھیک',
  'behtar': 'بہتر',
  'behtarhojayega': 'بہتر ہو جائے گا',
  'jaldtheekhojayega': 'جلد ٹھیک ہو جائے گا',
  'jaldbehtari': 'جلد بہتری',
  'allah': 'اللہ',
  'allahafiz': 'اللہ حافظ',
  'shifa': 'شفا',
  'shifade': 'شفا دے',

  // More durations
  '5days': '5 دن',
  '7days': '7 دن',
  '10days': '10 دن',
  '14days': '14 دن',
  '21days': '21 دن',
  '1month': '1 مہینہ',
  '2months': '2 مہینے',
  '3months': '3 مہینے',
  'prn': 'ضرورت کے مطابق',
  'sos': 'ضرورت کے مطابق',
  'whenneeded': 'ضرورت کے مطابق',
  'zarooratke': 'ضرورت کے',
  'zarooratkemutabiq': 'ضرورت کے مطابق',
  'zarurat': 'ضرورت',
  'mutabiq': 'مطابق',
  'bimar': 'بیمار',
  'bimarimein': 'بیماری میں',
  'sehat': 'صحت',
  'sehattandrusti': 'صحت تندرستی',
  'tandrusti': 'تندرستی',
  'hifazat': 'حفاظت',
  'hifazatkelye': 'حفاظت کے لیے',
  'bachao': 'بچاؤ',

  // Pain locations
  'kamar': 'کمر',
  'kamarmerdard': 'کمر میں درد',
  'kamarkee': 'کمر کی',
  'jawar': 'جور',
  'jawarkedard': 'جوڑوں کے درد',
  'jawarmein': 'جوڑوں میں',
  'jawarmeedard': 'جوڑوں میں درد',
  'hadion': 'ہڈیوں',
  'hadionmerdard': 'ہڈیوں میں درد',
  'pathon': 'پٹھوں',
  'pathonmerdard': 'پٹھوں میں درد',
  'peth': 'پیٹھ',
  'pethmerdard': 'پیٹھ میں درد',

  // More useful terms
  'aurat': 'عورت',
  'auratkelye': 'عورت کے لیے',
  'mard': 'مرد',
  'mardkelye': 'مرد کے لیے',
  'bache': 'بچے',
  'bachon': 'بچوں',
  'bachonkelye': 'بچوں کے لیے',
  'buzurg': 'بزرگ',
  'buzurgonkelye': 'بزرگوں کے لیے',
  'jawan': 'جوان',
  'jawanonkelye': 'جوانوں کے لیے',
  'sab': 'سب',
  'sabkelye': 'سب کے لیے',
  'harumr': 'ہر عمر',
  'umr': 'عمر',
  'kamumr': 'کم عمر',
  'zayadaumr': 'زیادہ عمر',

  // Warnings
  'dhyan': 'دھیان',
  'dhyanderahain': 'دھیان دیں',
  'aham': 'اہم',
  'ahambat': 'اہم بات',
  'jururi': 'ضروری',
  'jururibat': 'ضروری بات',
  'hatia': 'احتیاط',
  'hatiatakia': 'احتیاط کریں',
  'etiyat': 'احتیاط',
  'etiyatkaryain': 'احتیاط کریں',
  'khatra': 'خطرہ',
  'nuksan': 'نقصان',
  'nuksande': 'نقصان دے',
  'faida': 'فائدہ',
  'faidemand': 'فائدہ مند',
  'madadgar': 'مددگار',

  // Sleep related
  'sonesepahle': 'سونے سے پہلے',
  'sonesepehle': 'سونے سے پہلے',
  'sonese': 'سونے سے',
  'soneyse': 'سونے سے',
  'sonay': 'سونے',
  'jagte': 'جاگتے',
  'uthtay': 'اُٹھتے',
  'uthnay': 'اُٹھنے',
  'uthnekaybaad': 'اُٹھنے کے بعد',
  'bedtime': 'سوتے وقت',
  'subahnashte': 'صبح ناشتے',
  'dopaharkhana': 'دوپہر کھانا',
  'ratkhana': 'رات کھانا',
  'ratkakhana': 'رات کا کھانا',

  // Special cases for common compound words
  'adhakapahla': 'آدھا کا پہلا',
  'aadhakaphela': 'آدھا کا پہلا',
  'poora': 'پورا',
  'poori': 'پوری',
  'poorakhoray': 'پورا کھوریں',
  'poorakhae': 'پورا کھائیں',
  'pooralen': 'پورا لیں',
  'aadhakhaye': 'آدھا کھائیں',
  'aadhalen': 'آدھا لیں',
  'aadhagoli': 'آدھی گولی',
  'aadhitab': 'آدھی ٹیکٹ',
  'ekgoli': 'ایک گولی',
  'dogolian': 'دو گولیاں',
  'teengolian': 'تین گولیاں',
  'charbolian': 'چار گولیاں',
  'paanchgolian': 'پانچ گولیاں',

  // Common medical phrases
  'tibbi': 'طبی',
  'tibbimaswara': 'طبی مشورہ',
  'maswara': 'مشورہ',
  'ilaj': 'علاج',
  'ilajkaryein': 'علاج کریں',
  'tabeeb': 'طبیب',
  'hakeem': 'حکیم',
  'daktar': 'ڈاکٹر',
  'daktarsahib': 'ڈاکٹر صاحب',
  'hospetal': 'ہسپتال',
  'clinic': 'کلینک',
  'dawakhana': 'دواخانہ',
  'mariz': 'مریض',
  'bemar': 'بیمار',
  'tabiyat': 'طبیعت',
  'tabiyattheek': 'طبیعت ٹھیک',
  'tabiyatkharab': 'طبیعت خراب',
  'behtari': 'بہتری',
  'shifayat': 'شفایابی',

  // More common words
  'kamzori': 'کمزوری',
  'kamzor': 'کمزور',
  'tawanai': 'طاقت',
  'tawanadar': 'طاقتور',
  'tandrust': 'تندرست',
  'sehatmand': 'صحت مند',
  'shadab': 'شاداب',
  'taaza': 'تازہ',
  'purana': 'پرانا',
  'puranidawa': 'پرانی دوا',
  'naidawa': 'نئی دوا',
  'dawabdalain': 'دوا بدلیں',

  // Extended common words
  'adha': 'آدھا',
  'aadha': 'آدھا',
  'adhigoli': 'آدھی گولی',
  'tukra': 'ٹکڑا',
  'hissa': 'حصہ',
  'qism': 'قسم',
  'tarah': 'طرح',
  'jinsi': 'جنس',
  'type': 'قسم',
  'qadeem': 'قدیم',
  'naya': 'نیا',
  'puranay': 'پرانے',
  'zamany': 'زمانے',
  'dor': 'دور',
  'waqtanfa': 'وقتنفہ',
  'ab': 'اب',
  'aj': 'آج',
  'kal': 'کل',
  'parson': 'پرسوں',
  'qareeb': 'قریب',
  'door': 'دور',
  'piche': 'پیچھے',
  'agay': 'آگے',
  'oper': 'اوپر',
  'andar': 'اندر',
  'bahar': 'باہر',
  'lekar': 'لیکر',
  'bajaye': 'بجائے',
  'waja': 'وجہ',
  'sabab': 'سبب',
  'matlab': 'مطلب',
  'maqsad': 'مقصد',
  'kaam': 'کام',
  'kaaj': 'کاج',
  'nafa': 'نفع',
  'nuqsan': 'نقصان',
  'ghata': 'گھاٹا',
  'mufeed': 'مفید',
  'mazboot': 'مضبوط',
  'zor': 'زور',
  'sakhti': 'سختی',
  'narmi': 'نرمی',
  'halwa': 'حلوہ',
  'mithai': 'مٹھائی',
  'shorba': 'شوربہ',
  'salan': 'سالن',
  'roti': 'روٹی',
  'paratha': 'پراتھا',
  'dall': 'دال',
  'chawal': 'چاول',
  'gosht': 'گوشت',
  'murghi': 'مرغی',
  'machli': 'مچھلی',
  'anda': 'انڈہ',
  'anday': 'انڈے',
  'sabzi': 'سبزی',
  'phal': 'پھل',
  'ghee': 'گھی',
  'tel': 'تیل',
  'masala': 'مصالحہ',
  'namak': 'نمک',
  'mirch': 'مرچ',
  'haldi': 'ہلدی',
  'dahi': 'دہی',
  'lassi': 'لسی',
  'sardi': 'سردی',
  'garmi': 'گرمی',
  'nazla': 'نزلہ',
  'khasi': 'کھانسی',
  'dama': 'دما',
  'sanse': 'سانس',
  'saans': 'سانس',
  'jalan': 'جلن',
  'tezabiat': 'تیزابیت',
  'petdard': 'پیٹ درد',
  'khani': 'کھانی',
  'pini': 'پینی',
  'lgani': 'لگانی',
  'lagani': 'لگانی',
  'mah': 'مہینہ',
  'mu': 'منہ',
  'ultiyan': 'الٹیاں',
  'ulti': 'الٹی',
  'matli': 'متلی',
  'chakkar': 'چکر',
  'behusi': 'بے ہوشی',
  'chot': 'چوٹ',
  'zakhm': 'زخم',
  'kharash': 'خراش',
  'phora': 'پھوڑا',
  'phunsi': 'پھنسی',
  'danay': 'دانے',
  'phode': 'پھوڑے',
  'jildki': 'جلد کی',
  'bemari': 'بیماری',
  'marz': 'مرض',
  'alamat': 'علامات',
  'nishani': 'نشانی',
  'tashkhees': 'تشخیص',
  'mualaja': 'معالجہ',
  'tib': 'طب',
  'dawai': 'دوائی',
  'nuskha': 'نسخہ',
  'tajweez': 'تجویز',
  'tajweezkarda': 'تجویز کردہ',
  'hidayat': 'ہدایت',
  'taleemat': 'تعلیمات',
  'parhez': 'پرہیز',
  'parhezkari': 'پرہیزکاری',
  'ahamiyat': 'اہمیت',
  'zaroori': 'ضروری',
  'lazim': 'لازم',
  'mumtaz': 'ممتاز',
  'behtareen': 'بہترین',
  'kamqismat': 'کم قسمت',
  'achanak': 'اچانک',
  'dheere': 'دھیرے',
  'ahista': 'آہستہ',
  'jaldi': 'جلدی',
  'der': 'دیر',
  'waqtpar': 'وقت پر',
  'barwaqt': 'بروقت',
  'hamesha': 'ہمیشہ',
  'kabhikabhi': 'کبھی کبھی',
  'harbaar': 'ہر بار',
  'maheenaymain': 'مہینے میں',
  'saalmain': 'سال میں',
  'haftaymain': 'ہفتے میں',
  'subahko': 'صبح کو',
  'shaamko': 'شام کو',
  'dopahar ko': 'دوپہر کو',
  'pahlay': 'پہلے',
  'pehlay': 'پہلے',
  'baadmain': 'بعد میں',

  // More duration phrases
  'jubtak': 'جب تک',
  'jubtaktheek': 'جب تک ٹھیک',
  'jubtakbehtar': 'جب تک بہتر',
  'nahona': 'نہ ہو',
  'jubtaknahona': 'جب تک نہ ہو',
  'waqfah': 'وقفہ',
  'waqfahlen': 'وقفہ لیں',
  'derse': 'دیر سے',
  'dermat': 'دیر مت',
  'foran': 'فوراً',
  'foranlen': 'فوراً لیں',
  'abhi': 'ابھی',
  'abhile': 'ابھی لے',
  'baadmein': 'بعد میں',
  'pehlese': 'پہلے سے',
  'pehlehi': 'پہلے ہی',

  // Dosage related
  'dinars': 'دن',
  'hours': 'گھنٹے',
  'dinon': 'دنوں',
  'weeks': 'ہفتے',
  'months': 'مہینے',
  'salon': 'سالوں',

  // Common combinations
  'dinars5': '5 دن',
  'dinars7': '7 دن',
  'dinars10': '10 دن',
  'dinars14': '14 دن',
  'dinars21': '21 دن',
  'dinars30': '30 دن',
  'din30': '30 دن',
  'weeks2': '2 ہفتے',
  'weeks4': '4 ہفتے',
  'weeks6': '6 ہفتے',
  'months1': '1 مہینہ',
  'months2': '2 مہینے',
  'months3': '3 مہینے',
  'months6': '6 مہینے',
  'months12': '12 مہینے',
}

// Extended mapping for partial word replacement within compound words
export const urduPartialMap: Record<string, string> = {
  'din': 'دن',
  'raat': 'رات',
  'dafa': 'دفعہ',
  'baar': 'بار',
  'waqt': 'وقت',
  'subah': 'صبح',
  'shaam': 'شام',
  'dopahar': 'دوپہر',
  'pehle': 'پہلے',
  'pehly': 'پہلے',
  'baad': 'بعد',
  'ke': 'کے',
  'kay': 'کے',
  'ka': 'کا',
  'se': 'سے',
  'say': 'سے',
  'mein': 'میں',
  'main': 'میں',
  'me': 'میں',
  'ko': 'کو',
  'par': 'پر',
  'roz': 'روز',
}

/**
 * Transliterate Roman Urdu text to Urdu script
 * Handles both whole word replacement and partial (space-separated) replacement
 */
export function romanUrduToUrdu(text: string): string {
  if (!text || typeof text !== 'string') return ''

  const trimmed = text.trim()
  if (!trimmed) return ''

  // First, try exact match of the whole text (lowercase, no extra spaces)
  const normalizedText = trimmed.toLowerCase().replace(/\s+/g, ' ').trim()
  if (urduDictionary[normalizedText]) {
    return urduDictionary[normalizedText]
  }

  // Split by spaces and transliterate each word
  const words = normalizedText.split(/\s+/)
  const transliteratedWords = words.map(word => {
    // Try exact match first
    if (urduDictionary[word]) {
      return urduDictionary[word]
    }

    // Try matching without punctuation
    const cleanWord = word.replace(/[.,!?;:()\[\]{}'"]/g, '')
    if (urduDictionary[cleanWord]) {
      return urduDictionary[cleanWord]
    }

    // Return original if no match
    return word
  })

  // Join the transliterated words
  let result = transliteratedWords.join(' ')

  // Post-processing: fix common spacing issues in Urdu
  result = result.replace(/کے بعد/g, 'کے بعد')
  result = result.replace(/سے پہلے/g, 'سے پہلے')
  result = result.replace(/کھانے کے/g, 'کھانے کے')
  result = result.replace(/دودھ کے/g, 'دودھ کے')

  return result
}

/**
 * Check if text contains Roman Urdu patterns that should be transliterated
 */
export function containsRomanUrdu(text: string): boolean {
  if (!text) return false
  const normalized = text.toLowerCase().trim()

  // Check for exact matches
  if (urduDictionary[normalized]) return true

  // Check for partial matches
  const words = normalized.split(/\s+/)
  return words.some(word => urduDictionary[word] || urduPartialMap[word])
}

/**
 * Smart transliteration that preserves English medical terms
 * Only transliterates when clear Roman Urdu patterns are detected
 * Handles mixed Urdu/Roman Urdu text by processing word-by-word
 */
export function smartTransliterate(text: string): string {
  if (!text || typeof text !== 'string') return ''

  const trimmed = text.trim()
  if (!trimmed) return ''

  // Split by spaces and process each word
  const words = trimmed.split(/\s+/)

  // Check if we have a mix of Urdu and Roman Urdu
  const hasUrdu = words.some(w => /[\u0600-\u06FF]/.test(w))
  const hasRoman = words.some(w => !/[\u0600-\u06FF]/.test(w) && /[a-zA-Z]/.test(w))

  // If mixed or pure Roman Urdu, process word by word
  if (hasUrdu || hasRoman) {
    const processed = words.map(word => {
      // If word already has Urdu characters, keep it as is
      if (/[\u0600-\u06FF]/.test(word)) {
        return word
      }

      // Check if this Roman word should be transliterated
      const lowerWord = word.toLowerCase()
      if (urduDictionary[lowerWord]) {
        return urduDictionary[lowerWord]
      }

      // Try matching without punctuation
      const cleanWord = lowerWord.replace(/[.,!?;:()\[\]{}'"]/g, '')
      if (urduDictionary[cleanWord]) {
        return urduDictionary[cleanWord]
      }

      // Return original if no match
      return word
    })

    return processed.join(' ')
  }

  // Pure Roman Urdu - use the full transliteration
  if (containsRomanUrdu(text)) {
    return romanUrduToUrdu(text)
  }

  return text
}
