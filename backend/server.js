const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const app = express();
const port = 5000;

app.use(fileUpload());
app.use(express.json());
app.use(cors());

const GOOGLE_API_KEY = 'AIzaSyCd5X4XKTkBU5pd6xnbq87ILbiba5I8rfc'; // Replace with your actual API key

// Function to extract text from a PDF resume
function extractTextFromResume(file) {
  return new Promise((resolve, reject) => {
    if (file.mimetype === 'application/pdf') {
      pdfParse(file.data)
        .then(data => {
          resolve(data.text); // Extracted text from the PDF
        })
        .catch(err => {
          reject(err);
        });
    } else {
      resolve('Unsupported file format. Only PDF is supported.');
    }
  });
}

// Function to call the Gemini API to analyze resume text against job description
async function callGeminiAPI(resumeText, jobDescription) {
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Analyze this resume against the following job description and evaluate how well the resume matches the job description. Provide a detailed analysis on how the resume fits the job requirements: 
            
            Resume: ${resumeText}

            Job Description: ${jobDescription}`
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const apiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from API';
    return apiResponse;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to call Gemini API');
  }
}

// Endpoint to handle resume file upload and ATS score generation with Gemini API
app.post('/check-resume', async (req, res) => {
  try {
    if (!req.files || !req.files.resume) {
      return res.status(400).send('No resume uploaded');
    }

    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).send('No job description provided');
    }

    const resume = req.files.resume;
    console.log('Resume file uploaded:', resume.name); // Log file name

    // Extract text from the resume (PDF format)
    const resumeText = await extractTextFromResume(resume);
    if (!resumeText || resumeText.length === 0) {
      return res.status(400).json({ error: 'Failed to extract text from the resume.' });
    }

    console.log('Extracted Resume Text:', resumeText); // Log resume text

    // Call Gemini API with the extracted resume text and job description
    const geminiResponse = await callGeminiAPI(resumeText, jobDescription);
    console.log('Response from Gemini API:', geminiResponse);

    // Return the Gemini API analysis response to the frontend
    res.json({ geminiResponse }); // Return the analysis result from Gemini API
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ error: 'Failed to generate ATS score using Gemini API.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
