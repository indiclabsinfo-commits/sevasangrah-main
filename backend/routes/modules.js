/**
 * Module Access Control Routes
 * Manages user access to specific modules for phased testing
 * Related to: Magnus Hospital Phased Testing Strategy
 */

const express = require('express');
const router = express.Router();

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = (pool) => {
  // =====================================================
  // 1. Get all modules
  // =====================================================
  router.get('/', authenticateToken, async (req, res) => {
    try {
      console.log('📋 Fetching all modules...');

      const result = await pool.query(`
        SELECT * FROM modules
        ORDER BY display_order ASC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error fetching modules:', error);
      res.status(500).json({ error: 'Failed to fetch modules' });
    }
  });

  // =====================================================
  // 2. Get modules accessible by current user
  // =====================================================
  router.get('/my-access', authenticateToken, async (req, res) => {
    try {
      console.log('📋 Fetching accessible modules for user:', req.user.id);

      // Admins have access to all active modules
      if (req.user.role === 'ADMIN') {
        const result = await pool.query(`
          SELECT
            m.id as module_id,
            m.module_code,
            m.module_name,
            NOW() as access_granted_at,
            NULL as access_expires_at,
            true as is_currently_accessible,
            'Admin - Full Access' as notes
          FROM modules m
          WHERE m.is_active = true
          ORDER BY m.display_order ASC
        `);

        return res.json(result.rows);
      }

      // Regular users - check specific module access
      const result = await pool.query(`
        SELECT
          uma.user_id,
          uma.module_id,
          m.module_code,
          m.module_name,
          uma.access_granted_at,
          uma.access_expires_at,
          CASE
            WHEN uma.access_expires_at IS NULL THEN true
            WHEN uma.access_expires_at > NOW() THEN true
            ELSE false
          END as is_currently_accessible,
          uma.notes
        FROM user_module_access uma
        JOIN modules m ON uma.module_id = m.id
        WHERE uma.user_id = $1
        AND m.is_active = true
        ORDER BY m.display_order ASC
      `, [req.user.id]);

      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error fetching user module access:', error);
      res.status(500).json({ error: 'Failed to fetch module access' });
    }
  });

  // =====================================================
  // 3. Check if user has access to specific module
  // =====================================================
  router.get('/check-access/:moduleCode', authenticateToken, async (req, res) => {
    try {
      const { moduleCode } = req.params;
      console.log(`🔍 Checking if user ${req.user.id} has access to ${moduleCode}...`);

      // Admins have access to all modules
      if (req.user.role === 'ADMIN') {
        return res.json({ hasAccess: true, reason: 'Admin user' });
      }

      // Check specific module access using database function
      const result = await pool.query(
        `SELECT has_module_access($1, $2) as has_access`,
        [req.user.id, moduleCode]
      );

      const hasAccess = result.rows[0].has_access;

      console.log(`✅ Access check result for ${moduleCode}:`, hasAccess);
      res.json({ hasAccess });
    } catch (error) {
      console.error('❌ Error checking module access:', error);
      res.status(500).json({ error: 'Failed to check module access' });
    }
  });

  // =====================================================
  // 4. Grant module access to user (Admin only)
  // =====================================================
  router.post('/grant-access', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { userId, moduleCodes, grantedBy, expiresAt, notes } = req.body;

      console.log('🔑 Granting module access:', { userId, moduleCodes });

      if (!userId || !moduleCodes || !Array.isArray(moduleCodes)) {
        return res.status(400).json({ error: 'userId and moduleCodes array required' });
      }

      // Call database function to grant access
      const result = await pool.query(
        `SELECT grant_module_access($1, $2, $3, $4, $5) as granted_count`,
        [
          userId,
          moduleCodes,
          grantedBy || req.user.id,
          expiresAt || null,
          notes || null
        ]
      );

      const grantedCount = result.rows[0].granted_count;

      console.log(`✅ Granted access to ${grantedCount} modules`);
      res.json({
        grantedCount,
        message: `Access granted to ${grantedCount} module(s)`
      });
    } catch (error) {
      console.error('❌ Error granting module access:', error);
      res.status(500).json({ error: 'Failed to grant module access' });
    }
  });

  // =====================================================
  // 5. Revoke module access from user (Admin only)
  // =====================================================
  router.post('/revoke-access', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { userId, moduleCodes } = req.body;

      console.log('🔒 Revoking module access:', { userId, moduleCodes });

      if (!userId || !moduleCodes || !Array.isArray(moduleCodes)) {
        return res.status(400).json({ error: 'userId and moduleCodes array required' });
      }

      // Call database function to revoke access
      const result = await pool.query(
        `SELECT revoke_module_access($1, $2) as revoked_count`,
        [userId, moduleCodes]
      );

      const revokedCount = result.rows[0].revoked_count;

      console.log(`✅ Revoked access from ${revokedCount} modules`);
      res.json({
        revokedCount,
        message: `Access revoked from ${revokedCount} module(s)`
      });
    } catch (error) {
      console.error('❌ Error revoking module access:', error);
      res.status(500).json({ error: 'Failed to revoke module access' });
    }
  });

  // =====================================================
  // 6. Get all users and their module access (Admin only)
  // =====================================================
  router.get('/user-access-summary', authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log('📊 Fetching user module access summary...');

      const result = await pool.query(`
        SELECT * FROM v_user_module_access
        ORDER BY email, display_order
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('❌ Error fetching user access summary:', error);
      res.status(500).json({ error: 'Failed to fetch user access summary' });
    }
  });

  // =====================================================
  // 7. Update module testing status (Admin only)
  // =====================================================
  router.put('/:moduleCode/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { moduleCode } = req.params;
      const { status } = req.body;

      console.log(`🔄 Updating module ${moduleCode} status to ${status}...`);

      const validStatuses = ['NOT_STARTED', 'IN_DEVELOPMENT', 'READY_FOR_TESTING', 'TESTING', 'APPROVED', 'DEPLOYED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }

      const result = await pool.query(`
        UPDATE modules
        SET
          testing_status = $1,
          updated_at = NOW(),
          approved_date = CASE WHEN $1 = 'APPROVED' THEN NOW() ELSE approved_date END,
          tested_by = CASE WHEN $1 = 'APPROVED' THEN $2 ELSE tested_by END
        WHERE module_code = $3
        RETURNING *
      `, [status, req.user.id, moduleCode]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Module not found' });
      }

      console.log(`✅ Module ${moduleCode} status updated to ${status}`);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error updating module status:', error);
      res.status(500).json({ error: 'Failed to update module status' });
    }
  });

  // =====================================================
  // 8. Get testing credentials for a user (Admin only)
  // =====================================================
  router.get('/testing-credentials/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;

      console.log(`🔑 Fetching testing credentials for user ${userId}...`);

      const result = await pool.query(`
        SELECT
          tc.*,
          u.email,
          u.first_name,
          u.last_name
        FROM testing_credentials tc
        JOIN users u ON tc.user_id = u.id
        WHERE tc.user_id = $1
        ORDER BY tc.created_at DESC
      `, [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No testing credentials found for user' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error fetching testing credentials:', error);
      res.status(500).json({ error: 'Failed to fetch testing credentials' });
    }
  });

  // =====================================================
  // 9. Create testing credentials (Admin only)
  // =====================================================
  router.post('/testing-credentials', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const {
        userId,
        purpose,
        testerName,
        testerEmail,
        testerPhone,
        assignedModules,
        testingNotes
      } = req.body;

      console.log('🔑 Creating testing credentials for:', testerName);

      if (!userId || !purpose || !testerName) {
        return res.status(400).json({ error: 'userId, purpose, and testerName are required' });
      }

      const result = await pool.query(`
        INSERT INTO testing_credentials (
          user_id,
          purpose,
          tester_name,
          tester_email,
          tester_phone,
          assigned_modules,
          testing_notes,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        userId,
        purpose,
        testerName,
        testerEmail || null,
        testerPhone || null,
        JSON.stringify(assignedModules || []),
        testingNotes || null,
        true
      ]);

      console.log('✅ Testing credentials created:', result.rows[0]);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error creating testing credentials:', error);
      res.status(500).json({ error: 'Failed to create testing credentials' });
    }
  });

  // =====================================================
  // 10. Update last login time for testing account
  // =====================================================
  router.post('/testing-credentials/:userId/login', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;

      console.log(`🔑 Updating last login for testing account ${userId}...`);

      await pool.query(`
        UPDATE testing_credentials
        SET last_login_at = NOW()
        WHERE user_id = $1
      `, [userId]);

      res.json({ message: 'Last login updated' });
    } catch (error) {
      console.error('❌ Error updating last login:', error);
      res.status(500).json({ error: 'Failed to update last login' });
    }
  });

  return router;
};
