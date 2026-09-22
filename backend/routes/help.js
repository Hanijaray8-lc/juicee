const express = require('express');
const router = express.Router();
const HelpQuery = require('../models/HelpQuery');

// Helper to generate ticket number
const generateTicketNumber = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `#JQ-${randomNum}`;
};

// ================= POST /api/help/submit =================
// Submit a new Help & Support query
router.post('/submit', async (req, res) => {
  try {
    const { name, mobileNumber, category, issueDescription, screenshots, userId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!mobileNumber || !mobileNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }
    if (!issueDescription || !issueDescription.trim()) {
      return res.status(400).json({ success: false, message: 'Issue description is required' });
    }

    let ticketNumber = generateTicketNumber();
    let exists = await HelpQuery.findOne({ ticketNumber });
    let attempts = 0;
    while (exists && attempts < 5) {
      ticketNumber = generateTicketNumber();
      exists = await HelpQuery.findOne({ ticketNumber });
      attempts++;
    }

    const newQuery = new HelpQuery({
      ticketNumber,
      userId: userId || null,
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      category: category || 'App Bug / Technical Issue',
      issueDescription: issueDescription.trim(),
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      status: 'Pending',
      replies: [
        {
          sender: 'system',
          senderName: 'Juicy Support Desk',
          message: 'Thank you for reaching out! We have received your query and will update you shortly.',
          timestamp: new Date()
        }
      ]
    });

    const saved = await newQuery.save();
    return res.status(201).json({
      success: true,
      message: 'Support query submitted successfully',
      ticket: saved
    });
  } catch (error) {
    console.error('Error submitting help query:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit query', error: error.message });
  }
});

// ================= GET /api/help/queries =================
// Get all queries (with optional filters)
router.get('/queries', async (req, res) => {
  try {
    const { status, mobileNumber, userId } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (mobileNumber) {
      filter.mobileNumber = mobileNumber.trim();
    }
    if (userId) {
      filter.userId = userId;
    }

    let queries;
    try {
      queries = await HelpQuery.find(filter).sort({ createdAt: -1 }).lean();
    } catch (sortError) {
      console.warn('Direct MongoDB sort warning, falling back to in-memory sort:', sortError.message);
      queries = await HelpQuery.find(filter).lean();
      queries.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return res.json({
      success: true,
      count: queries.length,
      queries
    });
  } catch (error) {
    console.error('Error fetching help queries:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch queries', error: error.message });
  }
});

const mongoose = require('mongoose');

// ================= GET /api/help/queries/:id =================
// Get single query by MongoDB _id or ticketNumber
router.get('/queries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let query = null;
    const cleanId = id.trim();

    if (cleanId.startsWith('#JQ-') || cleanId.startsWith('JQ-')) {
      const ticketNum = cleanId.startsWith('#') ? cleanId : `#${cleanId}`;
      query = await HelpQuery.findOne({ ticketNumber: ticketNum });
    } else if (mongoose.Types.ObjectId.isValid(cleanId)) {
      query = await HelpQuery.findById(cleanId);
    } else {
      query = await HelpQuery.findOne({ ticketNumber: cleanId });
    }

    if (!query) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    return res.json({ success: true, query });
  } catch (error) {
    console.error('Error fetching single query:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch query', error: error.message });
  }
});

// ================= PUT /api/help/queries/:id/status =================
// Update status of query
router.put('/queries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Under Review', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const query = await HelpQuery.findById(id);
    if (!query) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    query.status = status;
    query.replies.push({
      sender: 'system',
      senderName: 'Juicy Support Desk',
      message: `Ticket status updated to: ${status}`,
      timestamp: new Date()
    });

    const updated = await query.save();
    return res.json({ success: true, message: `Status updated to ${status}`, ticket: updated });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
});

// ================= POST /api/help/queries/:id/reply =================
// Append a follow-up reply / comment
router.post('/queries/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, senderName, sender } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const query = await HelpQuery.findById(id);
    if (!query) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const newReply = {
      sender: sender || 'user',
      senderName: senderName || 'User',
      message: message.trim(),
      timestamp: new Date()
    };

    query.replies.push(newReply);
    const updated = await query.save();

    return res.json({ success: true, message: 'Reply added successfully', ticket: updated });
  } catch (error) {
    console.error('Error adding reply:', error);
    return res.status(500).json({ success: false, message: 'Failed to add reply', error: error.message });
  }
});

// ================= DELETE /api/help/queries/:id =================
// Delete a ticket
router.delete('/queries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await HelpQuery.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    return res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete ticket', error: error.message });
  }
});

module.exports = router;
