import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

class Grammarly {
    private model: any;
    constructor(apikey: string) {
        const API_KEY = apikey;
        if (!API_KEY) {
            return;
            // throw new Error("API_KEY not found in environment variables.");
        }
        const genAI = new GoogleGenerativeAI(API_KEY);

        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        if (!this.model || !this.model.generateContent) {
            console.log("Model or generateContent method is unavailable.");
            throw new Error("Model or generateContent method is unavailable.");
        }
        else {
            console.log("Model and generateContent method are available.");
        }
    }

    async grammarly(text: string | undefined) {
        try {
            let tamilText = text;
            console.log(tamilText);
            const textQuery = await this.model.generateContent(`The following input will be in English text but may contain words with Tamil pronunciation. 
                Convert the words to Tamil, but retain any english words which are required to be in english like names, places, etc.
                while preserving the original punctuation.
                MOST IMPORTANT: DO NOT CORRECT ANY ERRORS IN THE ENGLISH TEXT. 
                The input: ${text}`
            );
            
            tamilText = textQuery.response.text().trim();
            console.log("Converted to Tamil text:", tamilText);

            let correctedTextQuery = await this.model.generateContent(`
                The following input is in Tamil and it may have grammatical errors. Correct all grammatical errors. The input: ${tamilText}. Only provide the corrected text.
                Nothing else is required.
                `);

            // correctedTextQuery = await this.model.generateContent(`The following input is a combination of Tamil and English text. The user wants you to add this context to the text and perform this function on the input text. The input: ${tamilText}. The context ${context}. THE AUGMENTATION MUST CONTAIN MAJORLY TAMIL TEXT AND LITTLE ENGLISH. DONOT GIVE A TRANSLATION. INCLUDE A FEW IENGLISH WORDS ALONG WITH TAMIL TEXT.`)
            console.log("Corrected text:", correctedTextQuery.response.text());
            // console.log("Context : ", context);
            return correctedTextQuery.response.text();
        } 
        catch (e : any) {
            console.error("Error in Grammarly processing:", e);
            return `Error: ${e.message}`;
        }
    }

    async suggestNextSentenceTamil(text: string) {
        console.log("Suggesting next sentence for:", text);
        const nextSentence = await this.model.generateContent(`The following input is a sentence in Tamil.
        Provide the next sentence in Tamil. The input: ${text} Only give the tamil suggestion and nothing else`);
        console.log("Next sentence:", nextSentence.response.text());
        return nextSentence.response.text();
    }

    async suggestNextSentenceEnglish(text: string) {
        console.log("Suggesting next sentence for:", text);
        const nextSentence = await this.model.generateContent(`The following input is a sentence in English or Tamil or a combination of both languages. Suggest the sentence which should follow this text. 
        The input: ${text} Only give the english suggestion and nothing else`);
        console.log("Next sentence eng:", nextSentence.response.text());
        return nextSentence.response.text();
    }

    async summarize_paragraph(text: string, from_lang: string, to_lang: string) {
        try{
            let tamilText = text;
            console.log(tamilText);

            const textQuery = await this.model.generateContent(`Detect the language of the following text and summarize it accurately in the specified target language while preserving the core meaning. Maintain clarity and coherence in the summary. Output only the resultant text without any additional formatting or explanation.  

Input Language: ${from_lang}  
Target Language: ${to_lang} 
Input Text: ${text}`);

            tamilText = textQuery.response.text().trim();
            console.log("Summarized text:", tamilText);
            return tamilText;
        }
        catch (e : any) {
            console.error("Error in Grammarly processing:", e);
            return `Error: ${e.message}`;
        }
    }

    async translate(text: string, to_lang: string) {
        try {
            let tamilText = text;
            console.log(tamilText);

            const textQuery = await this.model.generateContent(`Transform a mixed Tamil-English text into a gramatically correct Tamil-script output while adhering to the given context.

                        Guidelines:
                        Convert the text primarily into gramatically and syntactically correct Tamil script while retaining relevant English words where appropriate.
                        Ensure proper grammar and spelling in both Tamil and English.
                        Preserve original punctuation unless a correction is necessary for readability.
                        Do not provide explanations, translations, or additional formatting.
                        Output should be a naturally flowing text that maintains coherence and readability.

                        Input: ${text}`);

            let translatedText = textQuery.response.text().trim();
            console.log("Translated text:", translatedText);
            return translatedText;
        }
        catch (e : any) {
            console.error("Error in Grammarly processing:", e);
            return `Error: ${e.message}`;
        }
    }
    async elaborate(text : string){
        const elaboratedLang = await this.model.generateContent(`Detect the language of the following text and provide a detailed elaboration in the same language. Ensure the elaboration is contextually relevant and maintains the tone and structure of the original text. Output only the resultant text without any additional formatting or explanation.  

**Input:** ${text}`);
        return elaboratedLang.response.text();
    }
}

export default Grammarly;
