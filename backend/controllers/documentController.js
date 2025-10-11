const db = require('../config/database');
const Document = require('../models/Document');
const path = require('path');
const fs = require('fs').promises;

async function listDocuments(req, res) {
  try {
    const { facilityId } = req.params;
    const { category, expiringOnly } = req.query;
    
    let documents = await db.list(`document:${facilityId}:`);
    
    documents = documents.map(doc => {
      const docInstance = new Document(doc);
      return {
        ...doc,
        expirationStatus: docInstance.getExpirationStatus()
      };
    });
    
    if (category) {
      documents = documents.filter(doc => doc.category.toLowerCase() === category.toLowerCase());
    }
    
    if (expiringOnly === 'true') {
      documents = documents.filter(doc => {
        return doc.expirationStatus === 'expiring_soon' || doc.expirationStatus === 'expired';
      });
    }
    
    documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const byCategory = documents.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    }, {});
    
    const expiringCount = documents.filter(doc => {
      return doc.expirationStatus === 'expiring_soon' || doc.expirationStatus === 'expired';
    }).length;
    
    res.json({
      success: true,
      data: documents,
      byCategory,
      summary: {
        total: documents.length,
        expiringSoon: expiringCount
      }
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching documents' 
    });
  }
}

async function uploadDocument(req, res) {
  try {
    const { facilityId } = req.params;
    const { category, name, description, expirationDate, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    const document = new Document({
      facilityId,
      category,
      name,
      description,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user?.name || req.user?.email || 'System',
      expirationDate: expirationDate || null,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : []
    });
    
    const errors = document.validate();
    if (errors.length > 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    await db.set(`document:${facilityId}:${document.id}`, document.toJSON());
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document.toJSON()
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading document' 
    });
  }
}

async function getDocument(req, res) {
  try {
    const { documentId } = req.params;
    
    const document = await db.getByPrefix(`document:`, (key, value) => value.id === documentId);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    const docInstance = new Document(document);
    const documentWithStatus = {
      ...document,
      expirationStatus: docInstance.getExpirationStatus()
    };
    
    res.json({
      success: true,
      data: documentWithStatus
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching document' 
    });
  }
}

async function downloadDocument(req, res) {
  try {
    const { documentId } = req.params;
    
    const document = await db.getByPrefix(`document:`, (key, value) => value.id === documentId);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    try {
      await fs.access(document.filePath);
    } catch {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found on server' 
      });
    }
    
    res.download(document.filePath, document.fileName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error downloading document' 
    });
  }
}

module.exports = {
  listDocuments,
  uploadDocument,
  getDocument,
  downloadDocument
};
