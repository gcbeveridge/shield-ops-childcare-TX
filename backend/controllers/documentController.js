const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

/**
 * Document Controller - Supabase Storage Edition
 * Uses Supabase Storage buckets for cloud-based file persistence
 * 
 * Files are stored in: documents/{facilityId}/{unique-filename}
 * Metadata is stored in: documents table
 */

async function listDocuments(req, res) {
    try {
        const { facilityId } = req.params;
        const { category, expiringOnly } = req.query;

        console.log('Fetching documents for facility:', facilityId);

        // Build query
        let query = supabase
            .from('documents')
            .select('*')
            .eq('facility_id', facilityId)
            .order('created_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        const { data: documents, error } = await query;

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Documents fetched:', documents?.length || 0);

        // Add expiration status to each document
        const documentsWithStatus = documents.map(doc => {
            const expirationStatus = getExpirationStatus(doc.expiration_date);
            return {
                ...doc,
                expirationStatus
            };
        });

        // Filter by expiring status if requested
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

        // Calculate summary stats
        const expiringCount = documentsWithStatus.filter(doc =>
            doc.expirationStatus === 'expiring_soon' || doc.expirationStatus === 'expired'
        ).length;

        res.json({
            success: true,
            data: filteredDocs,
            byCategory,
            summary: {
                total: filteredDocs.length,
                expiringSoon: expiringCount
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

        console.log('Uploading document to Supabase Storage:', {
            facilityId,
            fileName: req.file.originalname,
            size: req.file.size
        });

        // Generate unique file path in storage
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;
        const storagePath = `${facilityId}/${fileName}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase storage upload error:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log('File uploaded to storage:', uploadData.path);

        // Get public URL (even for private buckets, this gives the path)
        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(storagePath);

        // Save document metadata to database
        const documentData = {
            facility_id: facilityId,
            name: name || req.file.originalname,
            category: category || 'Other',
            description: description || null,
            file_name: req.file.originalname,
            file_path: urlData.publicUrl, // Store full URL for reference
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            storage_bucket: 'documents',
            storage_path: storagePath,
            uploaded_by: req.user?.name || req.user?.email || 'System',
            expiration_date: expirationDate || null,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : null
        };

        const { data: document, error: dbError } = await supabase
            .from('documents')
            .insert(documentData)
            .select()
            .single();

        if (dbError) {
            console.error('Database error saving document:', dbError);
            // Attempt to delete the uploaded file
            await supabase.storage.from('documents').remove([storagePath]);
            throw new Error(`Database error: ${dbError.message}`);
        }

        console.log('Document metadata saved to database:', document.id);

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully to cloud storage',
            data: document
        });
    } catch (error) {
        console.error('Error uploading document:', error);
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

        const expirationStatus = getExpirationStatus(document.expiration_date);

        res.json({
            success: true,
            data: {
                ...document,
                expirationStatus
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

        // Get document metadata from database
        const { data: document, error: dbError } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (dbError || !document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        if (!document.storage_path) {
            return res.status(404).json({
                success: false,
                message: 'Document file path not found'
            });
        }

        console.log('Downloading file from storage:', document.storage_path);

        // Download file from Supabase Storage
        const { data: fileData, error: storageError } = await supabase.storage
            .from('documents')
            .download(document.storage_path);

        if (storageError || !fileData) {
            console.error('Storage download error:', storageError);
            return res.status(404).json({
                success: false,
                message: 'File not found in storage',
                error: storageError?.message
            });
        }

        // Convert blob to buffer
        const buffer = Buffer.from(await fileData.arrayBuffer());

        // Set appropriate headers
        res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
        res.setHeader('Content-Length', buffer.length);

        // Send file
        res.send(buffer);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({
            success: false,
            message: 'Error downloading document',
            error: error.message
        });
    }
}

async function deleteDocument(req, res) {
    try {
        const { documentId } = req.params;

        console.log('Attempting to delete document:', documentId);

        // Get document metadata
        const { data: document, error: fetchError } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (fetchError) {
            console.error('Error fetching document:', fetchError);
            return res.status(404).json({
                success: false,
                message: 'Document not found',
                error: fetchError.message
            });
        }

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        console.log('Document found, deleting from storage and database...');

        // Delete file from storage first
        if (document.storage_path) {
            try {
                const { error: storageError } = await supabase.storage
                    .from('documents')
                    .remove([document.storage_path]);

                if (storageError) {
                    console.error('Error deleting file from storage:', storageError);
                    // Continue anyway to delete database record
                } else {
                    console.log('File deleted from storage successfully');
                }
            } catch (storageErr) {
                console.error('Storage deletion exception:', storageErr);
                // Continue to delete database record
            }
        }

        // Delete database record
        const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentId);

        if (deleteError) {
            console.error('Database delete error:', deleteError);
            return res.status(500).json({
                success: false,
                message: 'Error deleting document from database',
                error: deleteError.message
            });
        }

        console.log('Document deleted successfully');

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting document',
            error: error.message
        });
    }
}

// Helper function to determine expiration status
function getExpirationStatus(expirationDate) {
    if (!expirationDate) return 'none';

    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) return 'expired';
    if (daysUntilExpiration <= 30) return 'expiring_soon';
    return 'valid';
}

module.exports = {
    listDocuments,
    uploadDocument,
    getDocument,
    downloadDocument,
    deleteDocument
};
