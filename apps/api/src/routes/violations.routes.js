import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

const allowedStatuses = ['ACTIVE', 'UNDER_REVIEW', 'RESOLVED'];
const allowedSeverities = ['CRITICAL', 'WARNING', 'ELEVATED', 'STABLE'];
const allowedRuleTypes = ['PROXIMITY', 'DENSITY', 'CAPACITY'];

const normalizeUpper = (value) => String(value || '').toUpperCase();

const updateEntityFlagStatus = async (entityId) => {
  const activeCount = await prisma.violation.count({
    where: {
      entityId,
      status: {
        in: ['ACTIVE', 'UNDER_REVIEW'],
      },
    },
  });

  await prisma.entity.update({
    where: {
      id: entityId,
    },
    data: {
      isFlagged: activeCount > 0,
    },
  });
};

// ─── GET /api/v1/violations ─────────────────────────────
// user + admin boleh lihat
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      status,
      severity,
      ruleType,
      districtId,
      entityId,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (status) {
      const upperStatus = normalizeUpper(status);

      if (!allowedStatuses.includes(upperStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid violation status',
        });
      }

      where.status = upperStatus;
    }

    if (severity) {
      const upperSeverity = normalizeUpper(severity);

      if (!allowedSeverities.includes(upperSeverity)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid severity',
        });
      }

      where.severity = upperSeverity;
    }

    if (ruleType) {
      const upperRuleType = normalizeUpper(ruleType);

      if (!allowedRuleTypes.includes(upperRuleType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid rule type',
        });
      }

      where.ruleType = upperRuleType;
    }

    if (districtId) where.districtId = districtId;
    if (entityId) where.entityId = entityId;

    if (search) {
      where.OR = [
        {
          code: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const pageNumber = Math.max(parseInt(page), 1);
    const limitNumber = Math.min(Math.max(parseInt(limit), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const [violations, total] = await Promise.all([
      prisma.violation.findMany({
        where,
        skip,
        take: limitNumber,
        include: {
          entity: {
            select: {
              id: true,
              name: true,
              type: true,
              store: true,
              address: true,
            },
          },
          district: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          zoningRule: {
            select: {
              id: true,
              name: true,
              ruleType: true,
              minDistanceMeters: true,
              maxEntitiesPerZone: true,
            },
          },
        },
        orderBy: {
          detectedAt: 'desc',
        },
      }),
      prisma.violation.count({
        where,
      }),
    ]);

    res.json({
      success: true,
      data: violations,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/violations/summary ─────────────────────
// user + admin boleh lihat
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const [byStatus, bySeverity, byRuleType, totalActive, totalResolved] =
      await Promise.all([
        prisma.violation.groupBy({
          by: ['status'],
          _count: {
            status: true,
          },
        }),
        prisma.violation.groupBy({
          by: ['severity'],
          _count: {
            severity: true,
          },
        }),
        prisma.violation.groupBy({
          by: ['ruleType'],
          _count: {
            ruleType: true,
          },
        }),
        prisma.violation.count({
          where: {
            status: 'ACTIVE',
          },
        }),
        prisma.violation.count({
          where: {
            status: 'RESOLVED',
          },
        }),
      ]);

    res.json({
      success: true,
      data: {
        totalActive,
        totalResolved,
        byStatus: byStatus.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        bySeverity: bySeverity.map((item) => ({
          severity: item.severity,
          count: item._count.severity,
        })),
        byRuleType: byRuleType.map((item) => ({
          ruleType: item.ruleType,
          count: item._count.ruleType,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/violations/:id ─────────────────────────
// user + admin boleh lihat detail
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const violation = await prisma.violation.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        entity: {
          include: {
            district: true,
          },
        },
        district: true,
        zoningRule: true,
      },
    });

    if (!violation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found',
      });
    }

    res.json({
      success: true,
      data: violation,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/v1/violations/:id/resolve ───────────────
// hanya admin boleh resolve
router.patch('/:id/resolve', authenticate, isAdmin, async (req, res, next) => {
  try {
    const existingViolation = await prisma.violation.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingViolation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found',
      });
    }

    const violation = await prisma.violation.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    await updateEntityFlagStatus(violation.entityId);

    res.json({
      success: true,
      message: 'Violation resolved successfully',
      data: violation,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/v1/violations/:id/status ────────────────
// hanya admin boleh ubah status
router.patch('/:id/status', authenticate, isAdmin, async (req, res, next) => {
  try {
    const status = normalizeUpper(req.body.status);

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid violation status',
        allowedStatuses,
      });
    }

    const existingViolation = await prisma.violation.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingViolation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found',
      });
    }

    const violation = await prisma.violation.update({
      where: {
        id: req.params.id,
      },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
    });

    await updateEntityFlagStatus(violation.entityId);

    res.json({
      success: true,
      message: 'Violation status updated successfully',
      data: violation,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/v1/violations/:id/action ────────────────
// hanya admin boleh menjalankan action
router.patch('/:id/action', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { action, status } = req.body;

    let nextStatus = status;

    if (!nextStatus && action) {
      const normalizedAction = normalizeUpper(action);

      if (normalizedAction === 'RESOLVE' || normalizedAction === 'RESOLVED') {
        nextStatus = 'RESOLVED';
      }

      if (
        normalizedAction === 'REVIEW' ||
        normalizedAction === 'UNDER_REVIEW'
      ) {
        nextStatus = 'UNDER_REVIEW';
      }

      if (normalizedAction === 'REOPEN' || normalizedAction === 'ACTIVE') {
        nextStatus = 'ACTIVE';
      }
    }

    nextStatus = normalizeUpper(nextStatus);

    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action/status',
        allowedActions: ['RESOLVE', 'REVIEW', 'REOPEN'],
        allowedStatuses,
      });
    }

    const existingViolation = await prisma.violation.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingViolation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found',
      });
    }

    const violation = await prisma.violation.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: nextStatus,
        resolvedAt: nextStatus === 'RESOLVED' ? new Date() : null,
      },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            type: true,
            store: true,
            address: true,
            isFlagged: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        zoningRule: true,
      },
    });

    await updateEntityFlagStatus(violation.entityId);

    res.json({
      success: true,
      message: 'Violation action updated successfully',
      data: violation,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/violations ────────────────────────────
// hanya admin boleh create
router.post('/', authenticate, isAdmin, async (req, res, next) => {
  try {
    const {
      code,
      description,
      ruleType = 'PROXIMITY',
      severity = 'WARNING',
      status = 'ACTIVE',
      distanceM,
      entityId,
      districtId,
      zoningRuleId,
    } = req.body;

    if (!code || !description || !entityId || !districtId) {
      return res.status(400).json({
        success: false,
        error: 'code, description, entityId, dan districtId wajib diisi',
      });
    }

    const upperRuleType = normalizeUpper(ruleType);
    const upperSeverity = normalizeUpper(severity);
    const upperStatus = normalizeUpper(status);

    if (!allowedRuleTypes.includes(upperRuleType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rule type',
        allowedRuleTypes,
      });
    }

    if (!allowedSeverities.includes(upperSeverity)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid severity',
        allowedSeverities,
      });
    }

    if (!allowedStatuses.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid violation status',
        allowedStatuses,
      });
    }

    const entity = await prisma.entity.findUnique({
      where: {
        id: entityId,
      },
    });

    if (!entity) {
      return res.status(404).json({
        success: false,
        error: 'Entity not found',
      });
    }

    const district = await prisma.district.findUnique({
      where: {
        id: districtId,
      },
    });

    if (!district) {
      return res.status(404).json({
        success: false,
        error: 'District not found',
      });
    }

    if (zoningRuleId) {
      const zoningRule = await prisma.zoningRule.findUnique({
        where: {
          id: zoningRuleId,
        },
      });

      if (!zoningRule) {
        return res.status(404).json({
          success: false,
          error: 'Zoning rule not found',
        });
      }
    }

    const violation = await prisma.violation.create({
      data: {
        code,
        description,
        ruleType: upperRuleType,
        severity: upperSeverity,
        status: upperStatus,
        distanceM: distanceM !== undefined ? Number(distanceM) : null,
        entityId,
        districtId,
        zoningRuleId: zoningRuleId || null,
        resolvedAt: upperStatus === 'RESOLVED' ? new Date() : null,
      },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        zoningRule: true,
      },
    });

    await updateEntityFlagStatus(entityId);

    res.status(201).json({
      success: true,
      message: 'Violation created successfully',
      data: violation,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/v1/violations/:id ─────────────────────────
// hanya admin boleh update full
router.put('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const {
      code,
      description,
      ruleType,
      severity,
      status,
      distanceM,
      entityId,
      districtId,
      zoningRuleId,
      resolvedAt,
    } = req.body;

    const existingViolation = await prisma.violation.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingViolation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found',
      });
    }

    if (entityId) {
      const entity = await prisma.entity.findUnique({
        where: {
          id: entityId,
        },
      });

      if (!entity) {
        return res.status(404).json({
          success: false,
          error: 'Entity not found',
        });
      }
    }

    if (districtId) {
      const district = await prisma.district.findUnique({
        where: {
          id: districtId,
        },
      });

      if (!district) {
        return res.status(404).json({
          success: false,
          error: 'District not found',
        });
      }
    }

    if (zoningRuleId) {
      const zoningRule = await prisma.zoningRule.findUnique({
        where: {
          id: zoningRuleId,
        },
      });

      if (!zoningRule) {
        return res.status(404).json({
          success: false,
          error: 'Zoning rule not found',
        });
      }
    }

    const data = {};

    if (code !== undefined) data.code = code;
    if (description !== undefined) data.description = description;

    if (ruleType !== undefined) {
      const upperRuleType = normalizeUpper(ruleType);

      if (!allowedRuleTypes.includes(upperRuleType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid rule type',
          allowedRuleTypes,
        });
      }

      data.ruleType = upperRuleType;
    }

    if (severity !== undefined) {
      const upperSeverity = normalizeUpper(severity);

      if (!allowedSeverities.includes(upperSeverity)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid severity',
          allowedSeverities,
        });
      }

      data.severity = upperSeverity;
    }

    if (status !== undefined) {
      const upperStatus = normalizeUpper(status);

      if (!allowedStatuses.includes(upperStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid violation status',
          allowedStatuses,
        });
      }

      data.status = upperStatus;
      data.resolvedAt = upperStatus === 'RESOLVED' ? new Date() : null;
    }

    if (distanceM !== undefined) data.distanceM = Number(distanceM);
    if (entityId !== undefined) data.entityId = entityId;
    if (districtId !== undefined) data.districtId = districtId;
    if (zoningRuleId !== undefined) data.zoningRuleId = zoningRuleId || null;

    if (resolvedAt !== undefined) {
      data.resolvedAt = resolvedAt ? new Date(resolvedAt) : null;
    }

    const violation = await prisma.violation.update({
      where: {
        id: req.params.id,
      },
      data,
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
        zoningRule: true,
      },
    });

    await updateEntityFlagStatus(violation.entityId);

    if (existingViolation.entityId !== violation.entityId) {
      await updateEntityFlagStatus(existingViolation.entityId);
    }

    res.json({
      success: true,
      message: 'Violation updated successfully',
      data: violation,
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/v1/violations/:id ──────────────────────
// hanya admin boleh delete
router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const violation = await prisma.violation.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!violation) {
      return res.status(404).json({
        success: false,
        error: 'Violation not found',
      });
    }

    await prisma.violation.delete({
      where: {
        id: req.params.id,
      },
    });

    await updateEntityFlagStatus(violation.entityId);

    res.json({
      success: true,
      message: 'Violation deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

export default router;