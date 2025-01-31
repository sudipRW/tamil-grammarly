import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

class Grammarly {
    private model: any;

    constructor(apikey: string) {
        const API_KEY = apikey;
        if (!API_KEY) {
            throw new Error("API_KEY not found in environment variables.");
        }
        const genAI = new GoogleGenerativeAI(API_KEY);

        // Assuming getGenerativeModel() returns a model object that supports content generation
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        if (!this.model || !this.model.generateContent) {
            console.log("Model or generateContent method is unavailable.");
            throw new Error("Model or generateContent method is unavailable.");
        }
        else {
            console.log("Model and generateContent method are available.");
        }
    }

    async grammarly(text: string, context: string = "convert english to tamil") {
        try {
            if (!text.trim()) {
                throw new Error("Input text cannot be empty");
            }

            console.log("Input text:", text);
            console.log("Context:", context);

            // First pass: Convert Tamil pronunciation to Tamil script
            const textQuery = await this.model.generateContent({
                contents: [{
                    parts: [{
                        text: `The following input will be in English text but may contain words with Tamil pronunciation. 
                            Convert only the words with Tamil pronunciation to Tamil text, and retain other English words as is, 
                            while preserving the original punctuation. 
                            MOST IMPORTANT: DO NOT CORRECT ANY ERRORS IN THE ENGLISH TEXT. 
                            The input: ${text}`
                    }]
                }]
            });
            
            const tamilText = textQuery.response.text().trim();
            console.log("Converted to Tamil text:", tamilText);

            // Second pass: Apply context and generate final output
            const correctedTextQuery = await this.model.generateContent({
                contents: [{
                    parts: [{
                        text: `The following input is a combination of Tamil and English text. 
                            Apply this context: "${context}"
                            Rules:
                            1. The output must be primarily in Tamil script
                            2. Keep some relevant English words where appropriate
                            3. Ensure proper grammar and spelling in both languages
                            4. Maintain original punctuation unless it needs correction
                            5. DO NOT provide translations or explanations
                            6. Format the output as a natural flowing text
                            
                            Input text: ${tamilText}`
                    }]
                }]
            });

            const result = correctedTextQuery.response.text().trim();
            console.log("Final output:", result);
            
            if (!result) {
                throw new Error("Empty response from AI model");
            }

            return result;
        } 
        catch (e: any) {
            console.error("Error in Grammarly processing:", e);
            return `Error: ${e.message}`;
        }
    }
}

export default Grammarly;