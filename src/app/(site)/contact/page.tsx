import type { Metadata } from "next";

import { StaticPage } from "@/components/static-page";

export const metadata: Metadata = {
  title: "सम्पर्क",
  description: "चौतारी.dk सम्पादकीय डेस्कसँग सम्पर्क गर्नुहोस्।",
};

export default function ContactPage() {
  return (
    <StaticPage
      kicker="सम्पर्क"
      title="हामीलाई लेख्नुहोस्"
      intro="समाचार सुझाव, सुधार, विज्ञापन वा सहकार्यका लागि तलको इमेल प्रयोग गर्नुहोस्।"
    >
      <h2>समाचार डेस्क</h2>
      <p>
        कुनै घटना, नीति परिवर्तन वा समुदायको सरोकारबारे जानकारी छ भने
        <a href="mailto:news@chautari.dk"> news@chautari.dk</a> मा लेख्नुहोस्।
        सम्भव भएसम्म स्रोत, मिति र सम्पर्क विवरण संलग्न गर्नुहोस्।
      </p>

      <h2>सम्पादकीय</h2>
      <p>
        सुधार, प्रतिक्रिया वा विचार लेखका प्रस्तावका लागि
        <a href="mailto:editorial@chautari.dk"> editorial@chautari.dk</a>।
        विचार खण्डका लेख निमन्त्रणामा मात्र प्रकाशित हुन्छन्।
      </p>

      <h2>विज्ञापन</h2>
      <p>
        डेनमार्कका नेपाली समुदायलाई लक्षित विज्ञापनका लागि
        <a href="mailto:ads@chautari.dk"> ads@chautari.dk</a> मा सम्पर्क गर्नुहोस्।
      </p>

      <h2>गोपनीयता</h2>
      <p>
        व्यक्तिगत जानकारीसम्बन्धी प्रश्न वा हटाउने अनुरोधका लागि
        <a href="mailto:privacy@chautari.dk"> privacy@chautari.dk</a>।
      </p>

      <p className="static-note">
        चौतारी.dk, कोपनहेगन, डेनमार्क। इमेलको जवाफ सामान्यतया दुई
        कार्यदिनभित्र पाइनेछ।
      </p>
    </StaticPage>
  );
}
