import bcrypt from "bcryptjs";
import { PoolClient } from "pg";
import { getPostgresClient, closePostgresPool, sanitizeConnectionString } from "./postgres";
import {
  initialSeedUsers,
  initialSeedBuildings,
  initialSeedInspections,
  initialSeedDefects,
  initialSeedMaintenance,
  initialSeedDocuments,
} from "../data/seedData";

export interface EntitySeedResult {
  inserted: number;
  skipped: number;
  total: number;
}

export interface SeedSummary {
  users: EntitySeedResult;
  buildings: EntitySeedResult;
  building_photographs: EntitySeedResult;
  inspections: EntitySeedResult;
  defects: EntitySeedResult;
  maintenance: EntitySeedResult;
  documents: EntitySeedResult;
}

/**
 * Verifies that the inspection defects_count matches actual defect records referencing each inspection.
 * Throws an error if any discrepancy is found.
 */
export function verifyDefectCounts(): void {
  for (const insp of initialSeedInspections) {
    const matchingDefects = initialSeedDefects.filter((d) => d.inspectionId === insp.id);
    if (insp.defectsCount !== undefined && insp.defectsCount !== matchingDefects.length) {
      throw new Error(
        `Defect count mismatch for inspection ${insp.id} (${insp.inspectionId}): seed declares ${insp.defectsCount} but found ${matchingDefects.length} associated defect(s).`
      );
    }
  }
}

/**
 * Seeds all domain data into PostgreSQL inside a single transaction.
 * Follows strict foreign-key dependency order:
 * users -> buildings -> building_photographs -> inspections -> defects -> maintenance -> documents.
 * Fully idempotent: re-running does not produce duplicate records or constraint errors.
 */
export async function seedDatabase(): Promise<SeedSummary> {
  verifyDefectCounts();

  const client: PoolClient = await getPostgresClient();

  const summary: SeedSummary = {
    users: { inserted: 0, skipped: 0, total: initialSeedUsers.length },
    buildings: { inserted: 0, skipped: 0, total: initialSeedBuildings.length },
    building_photographs: { inserted: 0, skipped: 0, total: 0 },
    inspections: { inserted: 0, skipped: 0, total: initialSeedInspections.length },
    defects: { inserted: 0, skipped: 0, total: initialSeedDefects.length },
    maintenance: { inserted: 0, skipped: 0, total: initialSeedMaintenance.length },
    documents: { inserted: 0, skipped: 0, total: initialSeedDocuments.length },
  };

  try {
    await client.query("BEGIN;");

    // 1. SEED USERS
    for (const u of initialSeedUsers) {
      // Generate standard bcrypt hash with cost factor 10 from rawPasswordForDemo
      const passwordHash = u.rawPasswordForDemo
        ? await bcrypt.hash(u.rawPasswordForDemo, 10)
        : u.passwordHash;

      const userRes = await client.query(
        `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING;`,
        [
          u.id,
          u.name,
          u.email.toLowerCase().trim(),
          passwordHash,
          u.role,
          new Date(),
          new Date(),
        ]
      );

      if (userRes.rowCount && userRes.rowCount > 0) {
        summary.users.inserted++;
      } else {
        summary.users.skipped++;
      }
    }

    // 2. SEED BUILDINGS
    for (const b of initialSeedBuildings) {
      const bldRes = await client.query(
        `INSERT INTO buildings (
           id, passport_id, name, type, construction_date,
           location_address, location_city, location_state, location_postal_code,
           latitude, longitude, total_area, floors, units, usage, description,
           frame_type, foundation, fire_rating, exterior_cladding, seismic_zone,
           builder_company_name, builder_name, builder_contact, builder_details,
           owner_name, owner_contact, owner_email, owner_additional_info,
           qr_code_data_url, condition, maintenance_status,
           created_by, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
           $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
           $31, $32, $33, $34, $35
         )
         ON CONFLICT (id) DO NOTHING;`,
        [
          b.id,
          b.passportId,
          b.name,
          b.type,
          b.constructionDate,
          b.location.address,
          b.location.city,
          b.location.state || null,
          b.location.postalCode || null,
          b.location.coordinates?.lat ?? null,
          b.location.coordinates?.lng ?? null,
          b.totalArea,
          b.floors,
          b.units,
          b.usage,
          b.description || null,
          b.structuralInfo.frameType,
          b.structuralInfo.foundation,
          b.structuralInfo.fireRating,
          b.structuralInfo.exteriorCladding,
          b.structuralInfo.seismicZone || null,
          b.builder.companyName || null,
          b.builder.builderName || null,
          b.builder.contact || null,
          b.builder.details || null,
          b.owner?.name || null,
          b.owner?.contact || null,
          b.owner?.email || null,
          b.owner?.additionalInfo || null,
          b.qrCodeDataUrl || null,
          b.condition,
          b.maintenanceStatus,
          b.id === "bld_001_apex" ? "usr_owner_003" : null, // created_by
          b.createdAt ? new Date(b.createdAt) : new Date(),
          b.updatedAt ? new Date(b.updatedAt) : new Date(),
        ]
      );

      if (bldRes.rowCount && bldRes.rowCount > 0) {
        summary.buildings.inserted++;
      } else {
        summary.buildings.skipped++;
      }

      // 3. SEED BUILDING PHOTOGRAPHS (embedded in building in seedData)
      if (Array.isArray(b.photographs) && b.photographs.length > 0) {
        for (let idx = 0; idx < b.photographs.length; idx++) {
          const photo = b.photographs[idx];
          summary.building_photographs.total++;
          const photoId = `photo_${b.id}_${idx + 1}`;

          const photoRes = await client.query(
            `INSERT INTO building_photographs (
               id, building_id, url, caption, category, is_private, uploaded_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING;`,
            [
              photoId,
              b.id,
              photo.url,
              photo.caption || null,
              photo.category,
              Boolean(photo.isPrivate),
              photo.uploadedAt ? new Date(photo.uploadedAt) : new Date(),
            ]
          );

          if (photoRes.rowCount && photoRes.rowCount > 0) {
            summary.building_photographs.inserted++;
          } else {
            summary.building_photographs.skipped++;
          }
        }
      }
    }

    // 4. SEED INSPECTIONS
    for (const insp of initialSeedInspections) {
      const matchingDefectsCount = initialSeedDefects.filter((d) => d.inspectionId === insp.id).length;
      const defectsCountToStore = insp.defectsCount !== undefined ? insp.defectsCount : matchingDefectsCount;

      const inspRes = await client.query(
        `INSERT INTO inspections (
           id, inspection_id, building_id, inspector_id, inspector_name,
           date, observations, remarks, defects_count, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING;`,
        [
          insp.id,
          insp.inspectionId,
          insp.buildingId,
          insp.inspectorId || null,
          insp.inspectorName,
          insp.date,
          insp.observations,
          insp.remarks || null,
          defectsCountToStore,
          insp.createdAt ? new Date(insp.createdAt) : new Date(),
          insp.updatedAt ? new Date(insp.updatedAt) : new Date(),
        ]
      );

      if (inspRes.rowCount && inspRes.rowCount > 0) {
        summary.inspections.inserted++;
      } else {
        summary.inspections.skipped++;
      }
    }

    // 5. SEED DEFECTS
    for (const d of initialSeedDefects) {
      const defRes = await client.query(
        `INSERT INTO defects (
           id, defect_id, building_id, inspection_id, category,
           location, severity, status, details, image_ref, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING;`,
        [
          d.id,
          d.defectId,
          d.buildingId,
          d.inspectionId || null,
          d.category,
          d.location,
          d.severity,
          d.status,
          d.details,
          d.imageRef || null,
          d.createdAt ? new Date(d.createdAt) : new Date(),
          d.updatedAt ? new Date(d.updatedAt) : new Date(),
        ]
      );

      if (defRes.rowCount && defRes.rowCount > 0) {
        summary.defects.inserted++;
      } else {
        summary.defects.skipped++;
      }
    }

    // 6. SEED MAINTENANCE
    for (const m of initialSeedMaintenance) {
      const maintRes = await client.query(
        `INSERT INTO maintenance (
           id, maintenance_id, building_id, repair_type, repair_date,
           description, cost, status, contractor, warranty_details,
           expected_repairs, future_requirements, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING;`,
        [
          m.id,
          m.maintenanceId,
          m.buildingId,
          m.repairType,
          m.repairDate,
          m.description,
          m.cost,
          m.status,
          m.contractor,
          m.warrantyDetails || null,
          m.expectedRepairs || null,
          m.futureRequirements || null,
          m.createdAt ? new Date(m.createdAt) : new Date(),
          m.updatedAt ? new Date(m.updatedAt) : new Date(),
        ]
      );

      if (maintRes.rowCount && maintRes.rowCount > 0) {
        summary.maintenance.inserted++;
      } else {
        summary.maintenance.skipped++;
      }
    }

    // 7. SEED DOCUMENTS (Metadata only; no binary file fabrication)
    for (const doc of initialSeedDocuments) {
      const docRes = await client.query(
        `INSERT INTO documents (
           id, document_id, building_id, document_type, title,
           original_filename, storage_reference, file_size, mime_type,
           upload_date, uploaded_by, is_private, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING;`,
        [
          doc.id,
          doc.documentId,
          doc.buildingId,
          doc.documentType,
          doc.title,
          doc.originalFilename,
          doc.storageReference,
          doc.fileSize,
          doc.mimeType,
          doc.uploadDate ? new Date(doc.uploadDate) : new Date(),
          doc.uploadedBy || null,
          Boolean(doc.isPrivate),
          doc.createdAt ? new Date(doc.createdAt) : new Date(),
          doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        ]
      );

      if (docRes.rowCount && docRes.rowCount > 0) {
        summary.documents.inserted++;
      } else {
        summary.documents.skipped++;
      }
    }

    await client.query("COMMIT;");
    return summary;
  } catch (err: unknown) {
    await client.query("ROLLBACK;");
    const sanitized = sanitizeConnectionString((err as Error).message || "Unknown seed error");
    throw new Error(`Seeding transaction rolled back: ${sanitized}`);
  } finally {
    client.release();
  }
}

/**
 * CLI Runner entry point
 */
async function main() {
  console.log("==================================================");
  console.log("    BUILDING PASSPORT — POSTGRESQL SEED RUNNER    ");
  console.log("==================================================");

  try {
    const summary = await seedDatabase();

    console.log("[Seed Runner] Transaction committed successfully.");
    console.log(`[Seed Runner] Users:               ${summary.users.inserted} inserted, ${summary.users.skipped} skipped (total ${summary.users.total})`);
    console.log(`[Seed Runner] Buildings:           ${summary.buildings.inserted} inserted, ${summary.buildings.skipped} skipped (total ${summary.buildings.total})`);
    console.log(`[Seed Runner] Building Photos:     ${summary.building_photographs.inserted} inserted, ${summary.building_photographs.skipped} skipped (total ${summary.building_photographs.total})`);
    console.log(`[Seed Runner] Inspections:         ${summary.inspections.inserted} inserted, ${summary.inspections.skipped} skipped (total ${summary.inspections.total})`);
    console.log(`[Seed Runner] Defects:             ${summary.defects.inserted} inserted, ${summary.defects.skipped} skipped (total ${summary.defects.total})`);
    console.log(`[Seed Runner] Maintenance:         ${summary.maintenance.inserted} inserted, ${summary.maintenance.skipped} skipped (total ${summary.maintenance.total})`);
    console.log(`[Seed Runner] Documents (Meta):    ${summary.documents.inserted} inserted, ${summary.documents.skipped} skipped (total ${summary.documents.total})`);

    await closePostgresPool();
    process.exit(0);
  } catch (err: unknown) {
    const sanitized = sanitizeConnectionString((err as Error).message || "Unknown error");
    console.error(`[Seed Runner Fatal] ${sanitized}`);
    await closePostgresPool().catch(() => {});
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module || process.argv[1]?.includes("seed")) {
  main();
}
