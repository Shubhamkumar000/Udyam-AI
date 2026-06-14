import React, { useState } from 'react';
import { Send, Sparkles, Languages, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Udyan/Sidebar';

type Lang = 'en' | 'hi' | 'kn' | 'te' | 'ta';

interface QuickQuestion {
  id: string;
  question: { [key in Lang]: string };
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  language?: Lang;
  sources?: Array<{ source: string; score: number }>;
  mode?: 'rag' | 'fallback';
}

const UdyanChat: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<Lang>('en');
  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "Namaste! I am your Udyam AI Compliance copilot. Ask me any regulatory questions regarding GST, FSSAI, Trade Licenses, or Fire NOCs in your preferred language.",
      language: 'en'
    }
  ]);
  const [streaming, setStreaming] = useState(false);

  const languages: { code: Lang; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
  ];

  const quickQuestions: QuickQuestion[] = [
    {
      id: 'q-fssai',
      question: {
        en: "How do I renew FSSAI?",
        hi: "FSSAI रिन्यू कैसे करें?",
        kn: "FSSAI ಅನ್ನು ನವೀಕರಿಸುವುದು ಹೇಗೆ?",
        te: "FSSAI ని ఎలా పునరుద్ధరించాలి?",
        ta: "FSSAI ஐ எவ்வாறு புதுப்பிப்பது?"
      }
    },
    {
      id: 'q-trade-penalty',
      question: {
        en: "What is penalty for expired trade license?",
        hi: "समय सीमा समाप्त ट्रेड लाइसेंस के लिए जुर्माना क्या है?",
        kn: "ಅವಧಿ ಮುಗಿದ ಟ್ರೇಡ್ ಲೈಸೆನ್ಸ್ ದಂಡ ಎಷ್ಟು?",
        te: "గడువు ముగిసిన ట్రేడ్ లైసెన్స్ పెనాల్టీ ఎంత?",
        ta: "காலாவதியான வர்த்தக உரிமத்திற்கான அபராதம் என்ன?"
      }
    },
    {
      id: 'q-gst-inactive',
      question: {
        en: "My GST registration is inactive.",
        hi: "मेरा जीएसटी पंजीकरण निष्क्रिय है।",
        kn: "ನನ್ನ ಜಿಎಸ್ಟಿ ನೋಂದಣಿ ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ.",
        te: "నా జీఎస్టీ రిజిస్ట్రేషన్ ఇన్యాక్టివ్గా ఉంది.",
        ta: "எனது ஜிஎஸ்டி பதிவு செயலிழந்துள்ளது."
      }
    },
    {
      id: 'q-fire-noc',
      question: {
        en: "What documents are needed for Fire NOC renewal?",
        hi: "फायर एनओसी नवीनीकरण के लिए किन दस्तावेजों की आवश्यकता है?",
        kn: "ಫೈರ್ NOC ನವೀಕರಣಕ್ಕೆ ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?",
        te: "ఫైర్ NOC పునరుద్ధరణకు ఏ పత్రాలు అవసరం?",
        ta: "தீ NOC புதுப்பித்தலுக்கு என்ன ஆவணங்கள் தேவை?"
      }
    }
  ];

  // Professional Multilingual Expert Response Database
  const responseDb: { [key: string]: { [lang in Lang]: string } } = {
    'q-fssai': {
      en: `### **FSSAI License Renewal Guide**

**1. Explanation:**
FSSAI licenses can be renewed starting 120 days before expiry. It is mandatory for all food businesses (restaurants, cafes, cloud kitchens).

**2. Renewal Steps:**
- Log into the official Food Safety Compliance System (FoSCoS) portal.
- Select "Apply for Renewal" and choose your active license number.
- Update checklist parameters (menu, capacity, headcount) and upload documents.
- Pay the renewal fee online (from ₹100 to ₹7,500 based on scale).

**3. Risks of Non-compliance:**
- Operating with an expired certificate incurs a daily penalty of **₹100** starting from the expiration date.
- Complete closure orders and fines up to **₹5,00,000** in case of food safety violations.

**4. Required Documents:**
- Copy of existing FSSAI license certificate.
- Water analysis health report.
- Identity and address proof of the authorized owner.
- Layout map of food processing units.`,
      
      hi: `### **FSSAI लाइसेंस नवीनीकरण गाइड**

**1. विवरण:**
FSSAI लाइसेंस को समाप्ति से 120 दिन पहले रिन्यू किया जा सकता है। यह सभी खाद्य व्यवसायों के लिए अनिवार्य है।

**2. नवीनीकरण के चरण:**
- आधिकारिक FoSCoS पोर्टल पर लॉग इन करें।
- "Apply for Renewal" चुनें और अपना सक्रिय लाइसेंस नंबर डालें।
- विवरण अपडेट करें और सहायक दस्तावेज़ अपलोड करें।
- ऑनलाइन रिन्यूअल फीस का भुगतान करें (₹100 से ₹7,500 तक)।

**3. गैर-अनुपालन के जोखिम:**
- एक्सपायर्ड सर्टिफिकेट के साथ काम करने पर समाप्ति की तारीख से **₹100 प्रति दिन** का जुर्माना लगता है।
- खाद्य सुरक्षा नियमों के उल्लंघन पर **₹5,00,000** तक का जुर्माना और व्यवसाय बंद करने का आदेश।

**4. आवश्यक दस्तावेज़:**
- मौजूदा FSSAI लाइसेंस की प्रति।
- जल विश्लेषण स्वास्थ्य रिपोर्ट।
- मालिक का पहचान पत्र और पता प्रमाण।`,

      kn: `### **FSSAI ಪರವಾನಗಿ ನವೀಕರಣ ಮಾರ್ಗದರ್ಶಿ**

**1. ವಿವರಣೆ:**
FSSAI ಪರವಾನಗಿಯನ್ನು ಅವಧಿ ಮುಗಿಯುವ 120 ದಿನಗಳ ಮುಂಚಿತವಾಗಿ ನವೀಕರಿಸಬಹುದು. ಆಹಾರ ವ್ಯವಹಾರ ನಡೆಸುವ ಎಲ್ಲರಿಗೂ ಇದು ಕಡ್ಡಾಯವಾಗಿದೆ.

**2. ನವೀಕರಣದ ಹಂತಗಳು:**
- ಅಧಿಕೃತ FoSCoS ಪೋರ್ಟಲ್‌ಗೆ ಲಾಗ್ ಇನ್ ಮಾಡಿ.
- "Apply for Renewal" ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಸಕ್ರಿಯ ಪರವಾನಗಿ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.
- ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.
- ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ನವೀಕರಣ ಶುಲ್ಕವನ್ನು ಪಾವತಿಸಿ (₹100 ರಿಂದ ₹7,500 ವರೆಗೆ).

**3. ನಿಯಮ ಉಲ್ಲಂಘನೆಯ ಅಪಾಯಗಳು:**
- ಪರವಾನಗಿ ಅವಧಿ ಮುಗಿದ ನಂತರ ವ್ಯವಹಾರ ನಡೆಸಿದರೆ ದಿನಕ್ಕೆ **₹100** ದಂಡ ವಿಧಿಸಲಾಗುತ್ತದೆ.
- ಆಹಾರ ಸುರಕ್ಷತೆಯ ತೀವ್ರ ಉಲ್ಲಂಘನೆಗಳಿಗೆ **₹5,00,000** ವರೆಗೆ ದಂಡ ಮತ್ತು ವ್ಯವಹಾರ ಸ್ಥಗಿತ.

**4. ಅಗತ್ಯ ದಾಖಲೆಗಳು:**
- ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ FSSAI ಪರವಾನಗಿ ಪತ್ರದ ಪ್ರತಿ.
- ನೀರಿನ ಶುದ್ಧೀಕರಣ ಪರೀಕ್ಷಾ ವರದಿ.
- ಮಾಲೀಕರ ಗುರುತಿನ ჩೀಟಿ ಮತ್ತು ವಿಳಾಸದ ಪುರಾವೆ.`,

      te: `### **FSSAI లైసెన్స్ పునరుద్ధరణ గైడ్**

**1. వివరణ:**
FSSAI లైసెన్స్ గడువు ముగియడానికి 120 రోజుల ముందు నుండి పునరుద్ధరించుకోవచ్చు. ఆహార వ్యాపారాలకు ఇది తప్పనిసరి.

**2. పునరుద్ధరణ దశలు:**
- FoSCoS అధికారిక పోర్టల్ లాగిన్ అవ్వండి.
- "Apply for Renewal" ఎంపిక చేసి, మీ లైసెన్స్ నంబర్ ఎంటర్ చేయండి.
- వివరాలు సరిచూసి పత్రాలను అప్‌లోడ్ చేయండి.
- ఆన్‌లైన్ రుసుము చెల్లించండి (₹100 నుండి ₹7,500 వరకు).

**3. పెనాల్టీలు & నష్టాలు:**
- గడువు ముగిసిన తర్వాత ప్రతి రోజుకు **₹100** జరిమానా విధించబడుతుంది.
- తీవ్ర నిబంధనల ఉల్లంఘనకు **₹5,00,000** జరిమానా మరియు వ్యాపారం మూసివేత.

**4. అవసరమైన పత్రాలు:**
- పాత FSSAI లైసెన్స్ పత్రం.
- వాటర్ అనాలిసిస్ ల్యాబ్ రిపోర్ట్.
- యజమాని ఆధార్ / పాన్ కార్డు.`,

      ta: `### **FSSAI உரிமம் புதுப்பித்தல் வழிகாட்டி**

**1. விளக்கம்:**
FSSAI உரிமத்தை அது காலாவதியாவதற்கு 120 நாட்களுக்கு முன்பிலிருந்து புதுப்பிக்கலாம். அனைத்து உணவு வணிகங்களுக்கும் இது கட்டாயம்.

**2. புதுப்பிக்கும் படிகள்:**
- FoSCoS அதிகாரப்பூர்வ இணையதளத்தில் உள்நுழையவும்.
- "Apply for Renewal" என்பதைத் தேர்ந்தெடுத்து உங்கள் உரிம எண்ணை உள்ளிடவும்.
- தேவையான ஆவணங்களை பதிவேற்றவும்.
- புதுப்பித்தல் கட்டணத்தை ஆன்லைனில் செலுத்தவும் (₹100 முதல் ₹7,500 வரை).

**3. காலாவதி அபாயங்கள்:**
- காலாவதியான உரிமத்துடன் செயல்பட்டால் நாளொன்றுக்கு **₹100** அபராதம் வசூலிக்கப்படும்.
- உணவு பாதுகாப்பு விதிமீறல்களுக்கு **₹5,00,000** வரை அபராதம் மற்றும் கடைக்கு சீல்.

**4. தேவையான ஆவணங்கள்:**
- தற்போதைய FSSAI உரிம நகல்.
- தண்ணீர் பரிசோதனை ஆய்வக அறிக்கை.
- உரிமையாளரின் அடையாள மற்றும் முகவரி சான்று.`
    },
    'q-trade-penalty': {
      en: `### **Trade License Expired Penalties**

**1. Explanation:**
Trade Licenses are regulated by local municipal corporations (like BBMP, BMC, MCD). They expire annually, typically on March 31 or in rolling terms.

**2. Renewal Steps:**
- Log into your local municipal corporation site.
- Search for the existing Trade License registration record.
- Upload current year Property Tax clearance receipt.
- Submit sanitary conditions declaration and pay renewal charges.

**3. Risks of Non-compliance:**
- **50% penalty surcharge** on the original license fee if not renewed within the grace period.
- Prosecution under Municipal Laws and sealing of commercial premises.

**4. Required Documents:**
- Previous year Trade License copy.
- Latest property tax receipt of the building.
- Tenancy agreement or landlord NOC.
- Sanitary clearance certificate.`,

      hi: `### **ट्रेड लाइसेंस समाप्ति जुर्माना**

**1. विवरण:**
ट्रेड लाइसेंस स्थानीय नगर निगम (जैसे BBMP, BMC, MCD) द्वारा जारी किए जाते हैं। ये हर साल मार्च 31 या रोटेशन पर समाप्त होते हैं।

**2. नवीनीकरण के चरण:**
- स्थानीय नगर निगम की वेबसाइट पर जाएं।
- अपने पुराने ट्रेड लाइसेंस की खोज करें।
- इस वर्ष का संपत्ति कर भुगतान रसीद अपलोड करें।
- ऑनलाइन फीस का भुगतान करें।

**3. गैर-अनुपालन के जोखिम:**
- समय पर रिन्यू न करने पर मूल शुल्क पर **50% अतिरिक्त जुर्माना**।
- दुकान/प्रतिष्ठान को सील किए जाने की कानूनी कार्रवाई।

**4. आवश्यक दस्तावेज़:**
- पिछले वर्ष के ट्रेड लाइसेंस की कॉपी।
- नवीनतम संपत्ति कर भुगतान रसीद।
- किरायेनामा या मकान मालिक से अनापत्ति प्रमाण पत्र (NOC)।`,

      kn: `### **ಟ್ರೇಡ್ ಲೈಸೆನ್ಸ್ ಅವಧಿ ಮುಗಿದ ದಂಡಗಳು**

**1. ವಿವರಣೆ:**
ಟ್ರೇಡ್ ಲೈಸೆನ್ಸ್ ಸ್ಥಳೀಯ ಮಹಾನಗರ ಪಾಲಿಕೆಗಳು (ಉದಾ: BBMP) ನಿಯಂತ್ರಿಸುತ್ತವೆ. ಇದು ಪ್ರತಿ ವರ್ಷ ನವೀಕರಣಗೊಳ್ಳಬೇಕಾಗುತ್ತದೆ.

**2. ನವೀಕರಣದ ಹಂತಗಳು:**
- ನಿಮ್ಮ ಸ್ಥಳೀಯ ಪಾಲಿಕೆ ವೆಬ್‌ಸೈಟ್‌ಗೆ ಲಾಗ್ ಇನ್ ಮಾಡಿ.
- ಹಳೆಯ ಟ್ರೇಡ್ ಲೈಸೆನ್ಸ್ ವಿವರಗಳನ್ನು ಸರ್ಚ್ ಮಾಡಿ.
- ಚಾಲ್ತಿ ವರ್ಷದ ಆಸ್ತಿ ತೆರಿಗೆ ಪಾವತಿ ರಶೀದಿಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.
- ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ದಂಡ ಮತ್ತು ಪರವಾನಗಿ ಶುಲ್ಕ ಪಾವತಿಸಿ.

**3. ಅಪಾಯಗಳು:**
- ವಿಳಂಬ ಪಾವತಿಗೆ ಶುಲ್ಕದ ಮೇಲೆ **50% ದಂಡ** ವಿಧಿಸಲಾಗುತ್ತದೆ.
- ಪಾಲಿಕೆ ಅಧಿಕಾರಿಗಳಿಂದ ಉದ್ಯಮಕ್ಕೆ ಬೀಗ ಮುದ್ರೆ (Sealing) ಹಾಕುವ ಸಾಧ್ಯತೆ ಇರುತ್ತದೆ.

**4. ಅಗತ್ಯ ದಾಖಲೆಗಳು:**
- ಹಿಂದಿನ ವರ್ಷದ ಟ್ರೇಡ್ ಲೈಸೆನ್ಸ್ ಪ್ರತಿ.
- ಹೊಸ ಆಸ್ತಿ ತೆರಿಗೆ ರಶೀದಿ.
- ಬಾಡಿಗೆ ಒಪ್ಪಂದ ಪತ್ರ ಅಥವಾ ಮಾಲೀಕರ NOC.`,

      te: `### **ట్రేడ్ లైసెన్స్ గడువు జరిమానాలు**

**1. వివరణ:**
ట్రేడ్ లైసెన్సులను స్థానిక మున్సిపల్ కార్పొరేషన్లు (BBMP, GHMC) నియంత్రిస్తాయి. ఇవి ప్రతి సంవత్సరం పునరుద్ధరించాలి.

**2. పునరుద్ధరణ దశలు:**
- స్థానిక మున్సిపల్ వెబ్‌సైట్‌కు లాగిన్ అవ్వండి.
- పాత లైసెన్స్ వివరాల ఆధారంగా అప్లికేషన్ ఓపెన్ చేయండి.
- బిల్డింగ్ ప్రాపర్టీ టాక్స్ రశీదు అప్‌లోడ్ చేయండి.
- ఆన్‌లైన్ పేమెంట్ పూర్తి చేయండి.

**3. పెనాల్టీలు:**
- గడువు దాటిన తర్వాత అసలు ఫీజు పై **50% అదనపు పెనాల్టి** పడుతుంది.
- మున్సిపల్ అధికారులచే దుకాణాన్ని సీజ్ చేయడం జరుగుతుంది.

**4. అవసరమైన పత్రాలు:**
- మునుపటి ట్రేడ్ లైసెన్స్ కాపీ.
- లేటెస్ట్ ప్రాపర్టీ టాక్స్ రశీదు.
- అద్దె ఒప్పందం లేదా యజమాని NOC.
- శానిటరీ క్లియరెన్స్ సర్టిఫికేట్.`,

      ta: `### **வர்த்தக உரிமம் காலாவதி அபராதம்**

**1. விளக்கம்:**
வர்த்தக உரிமங்கள் (Trade Licenses) உள்ளூர் மாநகராட்சிகளால் வழங்கப்படுகின்றன. இவை ஒவ்வோராண்டும் புதுப்பிக்கப்பட வேண்டும்.

**2. புதுப்பிக்கும் படிகள்:**
- உள்ளூர் மாநகராட்சி இணையதளத்தில் உள்நுழையவும்.
- தற்போதுள்ள வர்த்தக உரிமப் பதிவைத் தேடவும்.
- நடப்பு ஆண்டின் சொத்து வரி செலுத்திய ரசீதை பதிவேற்றவும்.
- புதுப்பித்தல் கட்டணத்தை ஆன்லைனில் செலுத்தவும்.

**3. காலாவதி அபாயங்கள்:**
- சலுகைக் காலத்திற்குள் புதுப்பிக்காவிட்டால் அசல் உரிமக் கட்டணத்தில் **50% கூடுதல் அபராதம்**.
- மாநகராட்சி விதிகளின் கீழ் சட்ட நடவடிக்கை மற்றும் கடைக்கு சீல் வைக்கப்படும்.

**4. தேவையான ஆவணங்கள்:**
- முந்தைய ஆண்டின் வர்த்தக உரிம நகல்.
- கட்டிடத்தின் சமீபத்திய சொத்து வரி ரசீது.
- வாடகை ஒப்பந்தம் அல்லது உரிமையாளரின் NOC.
- சுகாதார சான்றிதழ்.`
    },
    'q-gst-inactive': {
      en: `### **Inactive GST Activation Guide**

**1. Explanation:**
If GST returns are not filed for 6 consecutive months, the GSTIN is suspended or cancelled by the department.

**2. Activation Steps:**
- File all pending GSTR-1 and GSTR-3B returns along with interest and late fees.
- Submit the application for revocation of cancellation (Form GST REG-21) on the GST portal.
- The tax officer will verify the application and reactivate the GSTIN.

**3. Risks of Non-compliance:**
- Your buyers will not get Input Tax Credit (ITC) for purchases made from you.
- Fines up to **₹10,000** or 10% of the tax due (whichever is higher).

**4. Required Documents:**
- Copy of Form GST REG-21 application.
- Challan payment proofs for all pending taxes, late fees, and penalties.`,

      hi: `### **निष्क्रिय जीएसटी सक्रियकरण गाइड**

**1. विवरण:**
लगातार 6 महीने तक जीएसटी रिटर्न दाखिल न करने पर आपका जीएसटी पंजीकरण निलंबित या रद्द किया जा सकता है।

**2. सक्रिय करने के चरण:**
- लंबित सभी रिटर्न (GSTR-1 और GSTR-3B) विलंब शुल्क और ब्याज के साथ फाइल करें।
- जीएसटी पोर्टल पर REG-21 एप्लिकेशन जमा करें।
- अधिकारी के सत्यापन के बाद आपका जीएसटी फिर से सक्रिय हो जाएगा।

**3. जोखिम और दंड:**
- आपके ग्राहकों का इनपुट टैक्स क्रेडिट (ITC) ब्लॉक हो जाएगा।
- **₹10,000** या कर देयता का 10% जुर्माना।

**4. आवश्यक दस्तावेज:**
- REG-21 आवेदन पत्र।
- लंबित करों और विलंब शुल्क के भुगतान का प्रमाण (Challans)।`,

      kn: `### **ನಿಷ್ಕ್ರಿಯ ಜಿಎಸ್ಟಿ ಸಕ್ರಿಯಗೊಳಿಸುವ ಮಾರ್ಗದರ್ಶಿ**

**1. ವಿವರಣೆ:**
ಸತತ 6 ತಿಂಗಳುಗಳ ಕಾಲ ಜಿಎಸ್ಟಿ ರಿಟರ್ನ್ಸ್ ಸಲ್ಲಿಸದಿದ್ದರೆ ಜಿಎಸ್ಟಿ ಸಂಖ್ಯೆಯನ್ನು ಅಮಾನತು (Suspended) ಮಾಡಲಾಗುತ್ತದೆ.

**2. ಸಕ್ರಿಯಗೊಳಿಸುವ ಹಂತಗಳು:**
- ಬಾಕಿ ಇರುವ ಎಲ್ಲಾ GSTR-1 ಮತ್ತು GSTR-3B ರಿಟರ್ನ್‌ಗಳನ್ನು ಲೇಟ್ ಫೀಸ್ ಸಮೇತ ಫೈಲ್ ಮಾಡಿ.
- ಜಿಎಸ್ಟಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ REG-21 ಅರ್ಜಿಯನ್ನು ಸಬ್‌ಮಿಟ್ ಮಾಡಿ.
- ಜಿಎಸ್ಟಿ ಅಧಿಕಾರಿ ಪರಿಶೀಲನೆ ನಡೆಸಿ ಸಕ್ರಿಯಗೊಳಿಸುವ ಆದೇಶ ಹೊರಡಿಸುತ್ತಾರೆ.

**3. ಅಪಾಯಗಳು:**
- ನಿಮ್ಮ ಗ್ರಾಹಕರಿಗೆ ಇನ್‌ಪುಟ್ ಟ್ಯಾಕ್ಸ್ ಕ್ರೆಡಿಟ್ (ITC) ಪಡೆಯಲು ಸಾಧ್ಯವಾಗುವುದಿಲ್ಲ.
- **₹10,000** ಅಥವಾ ತೆರಿಗೆಯ 10% ದಂಡ ವಿಧಿಸಲಾಗುತ್ತದೆ.

**4. ಅಗತ್ಯ ದಾಖಲೆಗಳು:**
- REG-21 ಪುನರುಜ್ಜೀವನ ಅರ್ಜಿ.
- ಬಾಕಿ ತೆರಿಗೆ ಪಾವತಿ ಮಾಡಿದ ರಶೀದಿ ಮತ್ತು ಚಲನ್ ಪ್ರತಿಗಳು.`,

      te: `### **జీఎస్టీ రీయాక్టివేషన్ గైడ్**

**1. వివరణ:**
వరుసగా 6 నెలల పాటు జీఎస్టీ రిటర్న్స్ దాఖలు చేయకుంటే మీ GSTIN సస్పెండ్ చేయబడుతుంది.

**2. పునరుద్ధరణ దశలు:**
- పెండింగ్‌లో ఉన్న GSTR-1 మరియు GSTR-3B రిటర్న్‌లను ఆలస్య రుసుముతో ఫైల్ చేయండి.
- జీఎస్టీ పోర్టల్ ద్వారా REG-21 దరఖాస్తును సమర్పించండి.
- అధికారులు పరిశీలించిన తర్వాత మీ జీఎస్టీ యాక్టివ్ అవుతుంది.

**3. పెనాల్tyలు:**
- కస్టమర్ల ITC (ఇన్‌పుట్ టాక్స్ క్రెడిట్) నిలిచిపోతుంది.
- కనీసం **₹10,000** జరిమానా చెల్లించాల్సి ఉంటుంది.

**4. అవసరమైన పత్రాలు:**
- REG-21 అప్లికేషన్ కాపీ.
- ఆలస్య రుసుము చెల్లింపు చలాన్లు.`,

      ta: `### **செயலிழந்த ஜிஎஸ்டி புதுப்பிப்பு வழிகாட்டி**

**1. விளக்கம்:**
தொடர்ந்து 6 மாதங்கள் ஜிஎஸ்டி ரிட்டன் தாக்கல் செய்யாவிட்டால் ஜிஎஸ்டி பதிவு தற்காலிகமாக ரத்து (Suspended) செய்யப்படும்.

**2. திரும்பப் பெறும் படிகள்:**
- நிலுவையில் உள்ள GSTR-1 மற்றும் GSTR-3B படிவங்களை அபராதத்துடன் தாக்கல் செய்யவும்.
- ஜிஎஸ்டி இணையதளத்தில் REG-21 படிவத்தை சமர்ப்பிக்கவும்.
- அதிகாரி சரிபார்த்த பின் ஜிஎஸ்டி மீண்டும் செயல்பாட்டிற்கு வரும்.

**3. காலாவதி அபாயங்கள்:**
- உங்கள் வாடிக்கையாளர்களுக்கு இன்புட் டேக்స్ கிரெடிட் (ITC) கிடைக்காது.
- **₹10,000** அல்லது வரித் தொகையில் 10% அபராதம் விதிக்கப்படும்.

**4. தேவையான ஆவணங்கள்:**
- REG-21 விண்ணப்ப நகல்.
- நிலுவை வரி செலுத்தியதற்கான சலான் நகல்கள்.`
    },
    'q-fire-noc': {
      en: `### **Fire NOC Renewal Compliance**

**1. Explanation:**
A Fire No Objection Certificate (NOC) certifies that a commercial building complies with fire safety regulations. It requires annual or triennial renewals.

**2. Renewal Steps:**
- Test all extinguisher installations, fire alarms, and sprinklers via certified safety inspectors.
- File renewal request on the state Fire Services online portal.
- Respond to physical inspections scheduled by regional fire officers.

**3. Risks of Non-compliance:**
- Complete loss of business insurance validity in case of any mishap.
- Cancellation of Eating House License or municipal trade license.
- Criminal prosecution for negligence.

**4. Required Documents:**
- Original Fire Safety NOC certificate.
- Certified electrical audit report.
- Fire equipment refilling invoice proofs.
- Architectural layout mapping exits.`,

      hi: `### **फायर एनओसी नवीनीकरण अनुपालन**

**1. विवरण:**
फायर नो ऑब्जेक्शन सर्टिफिकेट (NOC) प्रमाणित करता है कि आपकी व्यावसायिक इमारत अग्निशमन नियमों के अनुकूल है।

**2. नवीनीकरण के चरण:**
- अग्निशामक यंत्रों, अलार्म और स्प्रिंकलर की जांच किसी प्रमाणित निरीक्षक से कराएं।
- राज्य अग्निशमन सेवा पोर्टल पर आवेदन जमा करें।
- फायर विभाग के अधिकारियों द्वारा किए जाने वाले भौतिक निरीक्षण में सहयोग करें।

**3. गैर-अनुपालन के जोखिम:**
- किसी दुर्घटना की स्थिति में व्यावसायिक बीमा का अमान्य होना।
- नगर निगम द्वारा ट्रेड लाइसेंस या ईटिंग हाउस लाइसेंस का निरस्तीकरण।

**4. आवश्यक दस्तावेज़:**
- पुराना फायर एनओसी सर्टिफिकेट।
- इलेक्ट्रिकल सेफ्टी ऑडिट रिपोर्ट।
- अग्निशामक यंत्र रीफिलिंग के बिल।`,

      kn: `### **ಫೈರ್ NOC ನವೀಕರಣ ನಿಯಮಾವಳಿಗಳು**

**1. ವಿವರಣೆ:**
ಕಟ್ಟಡವು ಅಗ್ನಿ ಸುರಕ್ಷತಾ ನಿಯಮಗಳನ್ನು ಅನುಸರಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ದೃಢೀಕರಿಸುವ ಪ್ರಮಾಣಪತ್ರವೇ ಫೈರ್ NOC.

**2. ನವೀಕರಣದ ಹಂತಗಳು:**
- ಅಗ್ನಿಶಾಮಕ ಉಪಕರಣಗಳು, ಅಲಾರಂಗಳ ಗುಣಮಟ್ಟವನ್ನು ಅಗ್ನಿ ಸುರಕ್ಷತಾ ಇಂಜಿನಿಯರ್‌ ಮೂಲಕ ಪರೀಕ್ಷಿಸಿ.
- ರಾಜ್ಯ ಅಗ್ನಿಶಾಮಕ ಇಲಾಖೆ ವೆಬ್‌ಸೈಟ್‌ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.
- ಅಧಿಕಾರಿಗಳ ಭೌತಿಕ ತಪಾಸಣೆಯ ನಂತರ ಪ್ರಮಾಣಪತ್ರ ಪಡೆದುಕೊಳ್ಳಿ.

**3. ಅಪಾಯಗಳು:**
- ಅವಘಡ ಸಂಭವಿಸಿದರೆ ಉದ್ಯಮದ ಇನ್ಶೂರೆನ್ಸ್ ಅಮಾನ್ಯಗೊಳ್ಳುತ್ತದೆ.
- ಮುನ್ಸಿಪಲ್ ಟ್ರೇಡ್ ಲೈಸೆನ್ಸ್ ರದ್ದುಗೊಳಿಸುವ ಅಪಾಯವಿರುತ್ತದೆ.

**4. ಅಗತ್ಯ ದಾಖಲೆಗಳು:**
- ಹಿಂದಿನ ಫೈರ್ NOC ಪ್ರಮಾಣಪತ್ರ.
- ವಿದ್ಯುತ್ ತಪಾಸಣಾ ವರದಿ (Electrical audit).
- ಅಗ್ನಿಶಾಮಕ ಸಿಲಿಂಡರ್ ತುಂಬಿಸಿದ ಬಿಲ್‌ಗಳು.`,

      te: `### **ఫైర్ NOC పునరుద్ధరణ**

**1. వివరణ:**
వ్యాపార ప్రాంగణం అగ్ని ప్రమాదాల నివారణకు తగిన రక్షణ చర్యలను కలిగి ఉందని ఫైర్ NOC ధృవీకరిస్తుంది.

**2. పునరుద్ధరణ దశలు:**
- ఫైర్ అలారాలు మరియు స్ప్రింక్లర్లు సరిగా పనిచేస్తున్నాయో లేదో చెక్ చేయించండి.
- ఫైర్ సర్వీసెస్ ఆన్‌లైన్ పోర్టల్‌లో దరఖాస్తు చేయండి.
- అధికారులు జరిపే ఇన్‌స్పెక్షన్‌కు సహకరించండి.

**3. ప్రమాదాలు:**
- ప్రమాదం జరిగితే ఇన్సూరెన్స్ క్లెయిమ్ తిరస్కరించబడుతుంది.
- ట్రేడ్ లైసెన్స్ రద్దు చేయబడే అవకాశం ఉంది.

**4. అవసరమైన పత్రాలు:**
- పాత ఫైర్ NOC పత్రం.
- ఎలక్ట్రికల్ సేఫ్టీ ఆడిట్ సర్టిఫికెట్.
- ఫైర్ సిలిండర్ రీఫిల్లింగ్ బిల్స్.`,

      ta: `### **தீ NOC புதுப்பித்தல் விதிகள்**

**1. விளக்கம்:**
தீ விபத்து இல்லா சான்றிதழ் (Fire NOC) வணிகக் கட்டிடம் தீ பாதுகாப்பு விதிமுறைகளுக்கு உட்பட்டுள்ளது என்பதை உறுதிப்படுத்துகிறது.

**2. புதுப்பிக்கும் படிகள்:**
- தீயணைப்புக் கருவிகள், அலாரங்கள் மற்றும் ஸ்பிரிங்ளர்களை சான்றளிக்கப்பட்ட ஆய்வாளர்கள் மூலம் சரிபார்க்கவும்.
- தீயணைப்புத் துறை ஆன்லைன் இணையதளத்தில் விண்ணப்பிக்கவும்.
- தீயணைப்பு அதிகாரிகள் மேற்கொள்ளும் நேரடி ஆய்வுக்கு ஒத்துழைக்கவும்.

**3. காலாவதி அபாயங்கள்:**
- விபத்து ஏற்பட்டால் வணிகக் காப்பீடு செல்லாததாகிவிடும்.
- வர்த்தக உரிமம் மற்றும் ஈட்டிங் ஹவுஸ் உரிமம் உடனடியாக ரத்து செய்யப்படும்.

**4. தேவையான ஆவணங்கள்:**
- அசல் தீ சான்றிதழ் நகல்.
- சான்றளிக்கப்பட்ட மின் பாதுகாப்பு தணிக்கை அறிக்கை.
- தீயணைப்பு உபகரணங்களை புதுப்பித்ததற்கான கட்டண ரசீதுகள்.`
    }
  };

  const startStreamingResponse = (
    responseText: string,
    sources?: Array<{ source: string; score: number }>,
    mode?: 'rag' | 'fallback'
  ) => {
    let currentLength = 0;
    const streamMsg: ChatMessage = {
      sender: 'assistant',
      text: '',
      language: selectedLang,
      sources,
      mode
    };
    setChatHistory(prev => [...prev, streamMsg]);

    const interval = setInterval(() => {
      currentLength += 8; // character print speed
      if (currentLength >= responseText.length) {
        clearInterval(interval);
        setChatHistory(prev => {
          const updatedHistory = [...prev];
          updatedHistory[updatedHistory.length - 1].text = responseText;
          return updatedHistory;
        });
        setStreaming(false);
      } else {
        setChatHistory(prev => {
          const updatedHistory = [...prev];
          updatedHistory[updatedHistory.length - 1].text = responseText.slice(0, currentLength) + ' \u258C';
          return updatedHistory;
        });
      }
    }, 30);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: ChatMessage = { sender: 'user', text, language: selectedLang };
    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage('');
    setStreaming(true);

    const runOfflineFallback = () => {
      // Determine response. Check if text matches any quick questions
      let matchedKey = '';
      quickQuestions.forEach(q => {
        if (q.question.en.toLowerCase() === text.toLowerCase() || 
            q.question[selectedLang].toLowerCase() === text.toLowerCase()) {
          matchedKey = q.id;
        }
      });

      let responseText = '';
      if (matchedKey && responseDb[matchedKey]) {
        responseText = `*(Offline Fallback)*\n\n` + responseDb[matchedKey][selectedLang];
      } else {
        // Fallback custom generated multilingual answer simulation
        const generalFallbacks: { [key in Lang]: string } = {
          en: `### **Compliance Advisory Response**

I detected your query. As your Udyan AI Compliance copilot, I recommend checking your **Business Profile** coordinates.

**Recommended Renewal Steps:**
1. Navigate to the **Registered Licenses** dashboard.
2. Cross-reference the expiry date markers.
3. Download the specific checklist, and use the **Udyan AI portal redirect** to carry out the forms submission.`,
          hi: `### **अनुपालन सलाहकार प्रतिक्रिया**

मैंने आपका प्रश्न दर्ज किया है। आपके उद्यान एआई अनुपालन सह-पायलट के रूप में, मैं आपकी **व्यवसाय प्रोफ़ाइल** विवरण की जांच करने की अनुशंसा करता हूं।

**अनुशंसित नवीनीकरण चरण:**
1. **Registered Licenses** डैशबोर्ड पर जाएं।
2. समाप्ति तिथि मार्करों की जांच करें।
3. विशिष्ट चेकलिस्ट डाउनलोड करें, और फ़ॉर्म सबमिट करने के लिए **Udyan AI पोर्टल रीडायरेक्ट** का उपयोग करें।`,
          kn: `### **ಅನುಸರಣೆ ಸಲಹಾ ಉತ್ತರ**

ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ನಾನು ಗುರುತಿಸಿದ್ದೇನೆ. ಉದ್ಯಾನ್ ಎಐ ಸಹಾಯಕನಾಗಿ, ನಿಮ್ಮ **ವ್ಯವಹಾರ ಪ್ರೊಫೈಲ್** ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ.

**ಶಿಫಾರಸು ಮಾಡಲಾದ ನವೀಕರಣ ಹಂತಗಳು:**
1. **Registered Licenses** ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಭೇಟಿ ನೀಡಿ.
2. ಅವಧಿ ಮುಗಿಯುವ ದಿನಾಂಕಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.
3. ಚೆಕ್‌ಲಿಸ್ಟ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು **Udyan AI ಪೋರ್ಟಲ್ ರೀಡೈರೆಕ್ಟ್** ಬಳಸಿ.`,
          te: `### **ఆల్రైట్ సలహా ప్రతిస్పందన**

నేను మీ ప్రశ్నను గుర్తించాను. మీ ఉద్యాన్ AI కాపిలట్‌గా, మీ **వ్యాపార ప్రೊఫైల్** వివరాలను ఒకసారి తనిఖీ చేయాలని నేను సిఫార్సు చేస్తున్నాను.

**సిఫార్సు చేయబడిన దశలు:**
1. **Registered Licenses** డాష్‌బోర్డ్‌ను సందర్శించండి.
2. గడువు తేదీలను క్రాస్-చెక్ చేసుకోండి.
3. చెక్‌లిస్ట్ డౌన్‌లోడ్ చేసి, **Udyan AI పోర్టల్ రీడైరెక్ట్** ఉపయోగించండి.`,
          ta: `### **இணக்க ஆலோசனை பதில்**

உங்கள் கேள்வியை நான் கண்டறிந்துள்ளேன். உங்கள் உத்யன் AI உதவியாளராக, உங்கள் **வணிக சுயவிவரத்தை** சரிபார்க்க பரிந்துரைக்கிறேன்.

**புதுப்பிக்கும் படிகள்:**
1. **Registered Licenses** டாஷ்போர்டிற்குச் செல்லவும்.
2. காலாவதி தேதிகளை சரிபார்க்கவும்.
3. இணக்க சரிபார்ப்புப் பட்டியலை பதிவிறக்கம் செய்து, விண்ணப்பிக்க **Udyan AI போர்டல் ரீடைரெக்ட்** ஐப் பயன்படுத்தவும்.`
        };
        responseText = `*(Offline Fallback)*\n\n` + generalFallbacks[selectedLang];
      }


      startStreamingResponse(responseText, [], 'fallback');
    };

    const langNames: Record<Lang, string> = {
      en: 'English',
      hi: 'Hindi',
      kn: 'Kannada',
      te: 'Telugu',
      ta: 'Tamil',
    };

    const historyPayload = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    fetch('https://organic-space-disco-r4g7jr46pjvxcwj5-5002.app.github.dev/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: text,
        chatHistory: historyPayload,
        options: {
          language: langNames[selectedLang],
          tone: 'professional',
        },
      }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          startStreamingResponse(data.answer, data.sources, data.mode);
        } else {
          throw new Error(data.error || 'Server error occurred in query');
        }
      })
      .catch(err => {
        console.error('RAG API Error:', err);
        runOfflineFallback();
      });
  };

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen text-black font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F5F5F5]">
        
        {/* Header */}
        <header className="p-6 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-norms tracking-tight text-black flex items-center gap-2">
              Udyam AI Chat Assistant
              <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-0.5 rounded-full font-sans uppercase font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Sarvam AI
              </span>
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Ask compliance queries, penalty regulations, and document checklists in multiple languages.
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-1.5 rounded-xl">
            <Languages className="w-4 h-4 text-gray-400 ml-2" />
            <div className="flex gap-1">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => setSelectedLang(l.code)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                    selectedLang === l.code 
                      ? 'bg-black text-white shadow' 
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Chat Workspace split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Side: Chat bubbles */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
            
            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {chatHistory.map((msg, index) => {
                const isAssistant = msg.sender === 'assistant';
                return (
                  <div 
                    key={index}
                    className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed border ${
                      isAssistant 
                        ? 'bg-white border-gray-200 text-black rounded-tl-none shadow-sm' 
                        : 'bg-black border-black text-white rounded-tr-none shadow-sm'
                    }`}>
                      {/* Formatted output parser */}
                      <div className="space-y-2.5 whitespace-pre-wrap">
                        {msg.text.split('\n').map((line, i) => {
                          if (line.startsWith('### ')) {
                            return <h3 key={i} className="text-base font-bold font-norms text-black pt-1">{line.replace('### ', '')}</h3>;
                          }
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={i} className="font-bold text-gray-800 mt-2">{line.replace(/\*\*/g, '')}</p>;
                          }
                          return <p key={i} className={isAssistant ? 'text-gray-750' : 'text-white'}>{line}</p>;
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(inputMessage); }}
                className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-2.5 focus-within:border-black focus-within:bg-white transition-all"
              >
                <input
                  type="text"
                  placeholder={
                    selectedLang === 'en' ? "Type compliance questions..." :
                    selectedLang === 'hi' ? "अनुपालन प्रश्न पूछें..." :
                    selectedLang === 'kn' ? "ಅನುಸರಣೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ..." :
                    selectedLang === 'te' ? "ప్రశ్నలను అడగండి..." :
                    "கேள்விகளைக் கேளுங்கள்..."
                  }
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={streaming}
                  className="bg-transparent text-black text-sm focus:outline-none flex-1 pl-2.5"
                />
                
                <button
                  type="submit"
                  disabled={streaming || !inputMessage.trim()}
                  className="bg-black hover:bg-gray-800 text-white p-2.5 rounded-xl transition-all disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

          {/* Right Side: Quick query template sidebar */}
          <div className="hidden lg:block w-80 border-l border-gray-200 bg-white p-6 overflow-y-auto space-y-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">
              Suggested Compliance Prompts
            </h2>
            
            <div className="space-y-3">
              {quickQuestions.map((qq) => (
                <button
                  key={qq.id}
                  onClick={() => handleSend(qq.question[selectedLang])}
                  disabled={streaming}
                  className="w-full text-left p-3.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-2xl transition-all text-xs font-semibold text-gray-700 leading-normal flex gap-2 justify-between items-start group disabled:opacity-50"
                >
                  <span>{qq.question[selectedLang]}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black shrink-0 mt-0.5 transition-colors" />
                </button>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              <span className="text-[10px] text-indigo-755 font-bold uppercase tracking-wider block mb-1" style={{ color: '#4338CA' }}>
                Sarvam AI NLP Model
              </span>
              <p className="text-[11px] text-gray-550 leading-relaxed">
                Using translation-adapted models configured for Regional State circulars. Supports English, Hindi, Kannada, Telugu, and Tamil.
              </p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default UdyanChat;
