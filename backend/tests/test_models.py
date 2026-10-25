import pytest
from app.models.fasttext_lang import fasttext_lang_detector
from app.models.indictrans import indictrans_normalizer
from app.models.easyocr_clip import easyocr_clip_model
from app.models.xlmr_nli import xlmr_nli_model
from app.models.gemini_agent import gemini_agent

def test_language_detection():
    # Hindi text
    hi_res = fasttext_lang_detector.identify("बड़ा दावा: मध्यप्रदेश के सभी लोगों को तुरंत लाभ")
    assert hi_res["language_code"] in ("hi", "mr")

    # Marathi text
    mr_res = fasttext_lang_detector.identify("महाराष्ट्र मध्ये अधिकृत माहिती जाहीर करण्यात आली आहे")
    assert mr_res["language_code"] in ("mr", "hi")

    # English text
    en_res = fasttext_lang_detector.identify("Official information released regarding farmer subsidy")
    assert en_res["language_code"] == "en"

def test_indictrans_normalization():
    res = indictrans_normalizer.translate_to_english(
        "बड़ा दावा: Madhya Pradesh के सभी लोगों को financial scheme का तुरंत लाभ"
    )
    assert "translated_text" in res
    assert len(res["translated_text"]) > 0

def test_easyocr_clip():
    res = easyocr_clip_model.process_image(
        image_path="images/FN000010.jpg",
        claim_text="Official information released on international agreement in Rajasthan"
    )
    assert "clip_score" in res
    assert "image_text_consistency" in res
    assert 0.0 <= res["clip_score"] <= 1.0

def test_xlmr_nli():
    # Entailment test
    res_ent = xlmr_nli_model.predict(
        claim_text="Government announced public health advisory in Madhya Pradesh.",
        evidence_text="Official press release confirms public health advisory in Madhya Pradesh."
    )
    assert res_ent["label"] in ("ENTAILMENT", "NEUTRAL")
    assert res_ent["entailment_score"] > res_ent["contradiction_score"]

    # Contradiction test
    res_con = xlmr_nli_model.predict(
        claim_text="Viral claim: everyone in Delhi gets an immediate farmer subsidy benefit",
        evidence_text="Official notice: no immediate universal benefit has been announced."
    )
    assert res_con["label"] == "CONTRADICTION"
    assert res_con["contradiction_score"] > res_con["entailment_score"]

def test_gemini_claim_extraction():
    claims = gemini_agent.extract_structured_claims(
        "Government / Institution announced or implemented public health advisory in Madhya Pradesh."
    )
    assert len(claims) >= 1
    assert claims[0].location == "Madhya Pradesh"
    assert claims[0].object == "Public Health Advisory"
