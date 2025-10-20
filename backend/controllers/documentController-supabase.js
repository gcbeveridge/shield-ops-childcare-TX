const supabase = require('../config/supabase');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Helper function to calculate expiration status
function getExpirationStatus(expirationDate) {
  if (!expirationDate) return 'no_expiration';
  
  const now = new Date();
  const expDate = new Date(expirationDate);
  const daysUntilExpiration = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration < 0) return 'expired';
  if (daysUntilExpiration <= 30) return 'expiring_soon';
  return 'current';
}

async function listDocuments(req, res) {
  try {
    const { facilityId } = req.params;
    const { category, expiringOnly } = req.query;

    let query = supabase
      .from('documents')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('Supabase error fetching documents:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching documents',
        error: error.message
      });
    }

    // Add expiration status to each document
    const documentsWithStatus = (documents || []).map(doc => {
      const status = getExpirationStatus(doc.expiration_date);
      return {
        id: doc.id,
        facilityId: doc.facility_id,
        category: doc.category,
        name: doc.name,
        description: doc.description,
        fileName: doc.file_name,
        filePath: doc.file_path,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        uploadedBy: doc.uploaded_by,
        expirationDate: doc.expiration_date,
        tags: doc.tags || [],
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        expirationStatus: status,
        status: status === 'expired' ? 'Expired' : 
                status === 'expiring_soon' ? 'Expiring Soon' : 
                'Current'
      };
    });

    // Filter by expiring only if requested
    let filteredDocs = documentsWithStatus;
    if (expiringOnly === 'true') {
      filteredDocs = documentsWithStatus.filter(doc => 
        doc.expirationStatus === 'expiring_soon' || doc.expirationStatus === 'expired'
      );
    }

    // Group by category
    const byCategory = filteredDocs.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    }, {});

    // Calculate summary statistics
    const expiringCount = documentsWithStatus.filter(doc => 
      doc.expirationStatus === 'expiring_soon' || doc.expirationStatus === 'expired'
    ).length;

    const expiredCount = documentsWithStatus.filter(doc => 
      doc.expirationStatus === 'expired'
    ).length;

    const expiringSoonCount = documentsWithStatus.filter(doc => 
      doc.expirationStatus === 'expiring_soon'
    ).length;

    const currentCount = documentsWithStatus.filter(doc => 
      doc.expirationStatus === 'current' || doc.expirationStatus === 'no_expiration'
    ).length;

    res.json({
      success: true,
      data: filteredDocs,
      byCategory,
      summary: {
        total: documentsWithStatus.length,
        expiring: expiringCount,
        expired: expiredCount,
        expiringSoon: expiringSoonCount,
        current: currentCount
      }
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message
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

    if (!name || !category) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    const documentData = {
      id: uuidv4(),
      facility_id: facilityId,
      category,
      name,
      description: description || null,
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_by: req.user?.name || req.user?.email || 'System',
      expiration_date: expirationDate || null,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error uploading document:', error);
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(500).json({
        success: false,
        message: 'Error saving document to database',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: data.id,
        facilityId: data.facility_id,
        category: data.category,
        name: data.name,
        description: data.description,
        fileName: data.file_name,
        filePath: data.file_path,
        fileSize: data.file_size,
        mimeType: data.mime_type,
        uploadedBy: data.uploaded_by,
        expirationDate: data.expiration_date,
        tags: data.tags,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
}

async function getDocument(req, res) {
  try {
    const { documentId } = req.params;

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const status = getExpirationStatus(document.expiration_date);
    
    res.json({
      success: true,
      data: {
        id: document.id,
        facilityId: document.facility_id,
        category: document.category,
        name: document.name,
        description: document.description,
        fileName: document.file_name,
        filePath: document.file_path,
        fileSize: document.file_size,
        mimeType: document.mime_type,
        uploadedBy: document.uploaded_by,
        expirationDate: document.expiration_date,
        tags: document.tags || [],
        createdAt: document.created_at,
        updatedAt: document.updated_at,
        expirationStatus: status,
        status: status === 'expired' ? 'Expired' : 
                status === 'expiring_soon' ? 'Expiring Soon' : 
                'Current'
      }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document',
      error: error.message
    });
  }
}

async function downloadDocument(req, res) {
  try {
    const { documentId } = req.params;

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    try {
      await fs.access(document.file_path);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.download(document.file_path, document.file_name);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document',
      error: error.message
    });
  }
}

module.exports = {
  listDocuments,
  uploadDocument,
  getDocument,
  downloadDocument
};
