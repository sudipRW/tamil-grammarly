import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

class Grammarly {
    private model: any;
    constructor(apikey: string) {
        const API_KEY = apikey;
        if (!API_KEY) {
            throw new Error("API_KEY not found in environment variables.");
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

    async grammarly(text: string, context : string) {
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
            console.log("Context : ", context);
            return correctedTextQuery.response.text();
        } 
        catch (e : any) {
            console.error("Error in Grammarly processing:", e);
            return `Error: ${e.message}`;
        }
    }
}

export default Grammarly;
