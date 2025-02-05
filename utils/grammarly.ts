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
                        text: `Prompt:
Task: Convert English text that may contain Tamil-pronounced words into a mixed-script format.

                        Identify words that have a Tamil pronunciation and convert them into Tamil script.
                        Retain all other English words and punctuation exactly as they are.
                        Do not correct any spelling or grammatical errors in the input text.
                        Output Constraints:

                        Return only the transformed text, with no additional explanations, labels, or formatting.
                        Input:
                        ${text}`
                    }]
                }]
            });
            
            const tamilText = textQuery.response.text().trim();
            console.log("Converted to Tamil text:", tamilText);

            // Second pass: Apply context and generate final output
            const correctedTextQuery = await this.model.generateContent({
                contents: [{
                    parts: [{
                        text: `Task:
                        Transform a mixed Tamil-English text into a gramatically correct Tamil-script output while adhering to the given context.

                        Guidelines:
                        Convert the text primarily into gramatically and syntactically correct Tamil script while retaining relevant English words where appropriate.
                        Ensure proper grammar and spelling in both Tamil and English.
                        Preserve original punctuation unless a correction is necessary for readability.
                        Do not provide explanations, translations, or additional formatting.
                        Output should be a naturally flowing text that maintains coherence and readability.

                        Input:
                        ${tamilText}`
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