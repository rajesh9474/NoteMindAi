const supabase = require('../config/supabase');
const { extractTextFromPDF } = require('../services/pdfService');
const {
  generateSummary,
  generateQuiz,
  generateFlashcards,
  askQuestion,
} = require('../services/geminiService');
const path = require('path');
const fs = require('fs');

/**
 * Upload a document, extract text, generate AI study content.
 */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const userId = req.user.id;
    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${userId}/${Date.now()}${fileExt}`;

    console.log('--- UPLOAD START ---');
    console.log('User ID:', userId);
    console.log('File:', file.originalname, 'Size:', file.size, 'Type:', file.mimetype);

    // 1. Upload file to Supabase Storage
    console.log('Step 1: Uploading to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Step 1 FAILED:', JSON.stringify(uploadError));
      return res.status(500).json({ error: 'Failed to upload file to storage.', details: uploadError.message });
    }
    console.log('Step 1 OK');

    // 2. Get public URL
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
    const fileUrl = urlData.publicUrl;
    console.log('Step 2 OK - URL:', fileUrl);

    // 3. Store document record
    console.log('Step 3: Saving document record...');
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert([{ user_id: userId, file_name: file.originalname, file_url: fileUrl }])
      .select()
      .single();

    if (docError) {
      console.error('Step 3 FAILED:', JSON.stringify(docError));
      return res.status(500).json({ error: 'Failed to save document record.', details: docError.message });
    }
    console.log('Step 3 OK - Doc ID:', doc.id);

    // 4. Try AI processing — if it fails, document is still saved
    let summaryText = '';
    let quizQuestions = [];
    let flashcardItems = [];
    let aiProcessed = false;
    let aiError = null;

    try {
      // Extract text
      console.log('Step 4: Extracting text from PDF...');
      const extractedText = await extractTextFromPDF(file.buffer);
      console.log('Step 4 OK - Extracted', extractedText.length, 'chars');

      if (extractedText && extractedText.trim().length >= 50) {
        // Generate AI content sequentially with delays
        console.log('Step 5a: Generating summary...');
        summaryText = await generateSummary(extractedText);
        console.log('  Summary done. Waiting 5s...');
        await new Promise((r) => setTimeout(r, 5000));

        console.log('Step 5b: Generating quiz...');
        quizQuestions = await generateQuiz(extractedText);
        console.log('  Quiz done. Waiting 5s...');
        await new Promise((r) => setTimeout(r, 5000));

        console.log('Step 5c: Generating flashcards...');
        flashcardItems = await generateFlashcards(extractedText);
        console.log('Step 5 OK - All AI content generated');

        // Store results
        console.log('Step 6: Storing AI results...');
        await supabase.from('summaries').insert([{ document_id: doc.id, summary_text: summaryText }]);

        if (quizQuestions.length > 0) {
          await supabase.from('quizzes').insert(quizQuestions.map((q) => ({
            document_id: doc.id, question: q.question, options: q.options, correct_answer: q.correct_answer,
          })));
        }

        if (flashcardItems.length > 0) {
          await supabase.from('flashcards').insert(flashcardItems.map((f) => ({
            document_id: doc.id, question: f.question, answer: f.answer,
          })));
        }
        console.log('Step 6 OK');
        aiProcessed = true;
      } else {
        aiError = 'Extracted text is too short for AI processing.';
        console.log('Step 4 SKIPPED - text too short');
      }
    } catch (err) {
      aiError = err.message;
      console.error('AI processing failed (document still saved):', err.message);
    }

    console.log('--- UPLOAD COMPLETE ---');

    res.status(201).json({
      message: aiProcessed
        ? 'Document uploaded and processed successfully.'
        : 'Document uploaded. AI processing failed — you can reprocess later.',
      document: doc,
      aiProcessed,
      aiError,
      summary: summaryText,
      quiz: quizQuestions,
      flashcards: flashcardItems,
    });
  } catch (err) {
    console.error('Upload error (uncaught):', err.message);
    res.status(500).json({ error: 'Internal server error during upload.', details: err.message });
  }
};

/**
 * Get all documents for the logged-in user.
 */
exports.getUserDocuments = async (req, res) => {
  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', req.user.id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Fetch documents error:', error);
      return res.status(500).json({ error: 'Failed to fetch documents.' });
    }

    res.json({ documents });
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Get a single document with its generated study content.
 */
exports.getDocumentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Fetch related content in parallel
    const [summaryRes, quizRes, flashcardRes] = await Promise.all([
      supabase.from('summaries').select('*').eq('document_id', id).single(),
      supabase.from('quizzes').select('*').eq('document_id', id),
      supabase.from('flashcards').select('*').eq('document_id', id),
    ]);

    res.json({
      document: doc,
      summary: summaryRes.data?.summary_text || null,
      quiz: quizRes.data || [],
      flashcards: flashcardRes.data || [],
    });
  } catch (err) {
    console.error('Document detail error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Ask AI a question about a specific document.
 */
exports.askDocumentQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    // Fetch document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Download original file to re-extract text
    const filePath = doc.file_url.split('/documents/')[1];
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (downloadError || !fileData) {
      return res.status(500).json({ error: 'Could not retrieve document for Q&A.' });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const text = await extractTextFromPDF(buffer);

    const answer = await askQuestion(text, question);

    res.json({ answer });
  } catch (err) {
    console.error('Ask question error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Reprocess a document — re-generate AI content for a document that has empty content.
 */
exports.reprocessDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    console.log('--- REPROCESS START ---');
    console.log('Document:', doc.file_name, 'ID:', doc.id);

    // Download original file from storage
    const urlParts = doc.file_url.split('/documents/');
    const filePath = urlParts[urlParts.length - 1];

    console.log('Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return res.status(500).json({ error: 'Could not download document from storage.' });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Extract text
    console.log('Extracting text...');
    const extractedText = await extractTextFromPDF(buffer);

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(422).json({ error: 'Extracted text is too short.' });
    }
    console.log('Extracted', extractedText.length, 'characters');

    // Delete existing AI content for this document
    console.log('Clearing old AI content...');
    await supabase.from('summaries').delete().eq('document_id', id);
    await supabase.from('quizzes').delete().eq('document_id', id);
    await supabase.from('flashcards').delete().eq('document_id', id);

    // Generate AI content sequentially
    console.log('Generating summary...');
    const summaryText = await generateSummary(extractedText);
    await new Promise((r) => setTimeout(r, 5000));

    console.log('Generating quiz...');
    const quizQuestions = await generateQuiz(extractedText);
    await new Promise((r) => setTimeout(r, 5000));

    console.log('Generating flashcards...');
    const flashcardItems = await generateFlashcards(extractedText);

    // Store results
    console.log('Saving results...');
    await supabase.from('summaries').insert([{ document_id: id, summary_text: summaryText }]);

    if (quizQuestions.length > 0) {
      await supabase.from('quizzes').insert(quizQuestions.map((q) => ({
        document_id: id, question: q.question, options: q.options, correct_answer: q.correct_answer,
      })));
    }

    if (flashcardItems.length > 0) {
      await supabase.from('flashcards').insert(flashcardItems.map((f) => ({
        document_id: id, question: f.question, answer: f.answer,
      })));
    }

    console.log('--- REPROCESS COMPLETE ---');

    res.json({
      message: 'Document reprocessed successfully.',
      summary: summaryText,
      quiz: quizQuestions,
      flashcards: flashcardItems,
    });
  } catch (err) {
    console.error('Reprocess error:', err.message);
    res.status(500).json({ error: 'Failed to reprocess document.', details: err.message });
  }
};

/**
 * Delete a document and all its related content.
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Delete from database (cascade will handle related tables)
    await supabase.from('documents').delete().eq('id', id);

    res.json({ message: 'Document deleted.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
};
