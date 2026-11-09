const express = require('express');
const router = express.Router();
const { handleAIChatbotQuery } = require('../aiEngine');

router.post('/message', (req, res) => {
  try {
    const { message, language = 'en', user } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const aiResponse = handleAIChatbotQuery({
      message: message.trim(),
      language,
      user
    });

    res.json(aiResponse);
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({
      reply: 'An error occurred while consulting the AI Food Rescue Agent. Please try again.',
      suggestions: ['How to donate food?', 'Where can I find food?', 'Food safety guidelines']
    });
  }
});

module.exports = router;

