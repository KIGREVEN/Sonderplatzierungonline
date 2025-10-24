const { query } = require('../config/database');

(async () => {
  try {
    console.log('🔧 Erweitere bookings-Tabelle um Laufzeit-Felder...');

    // 1. duration_start und duration_end hinzufügen (optional, nur für laufzeit-basierte Artikel-Typen)
    console.log('\n1️⃣ Füge duration_start und duration_end Spalten hinzu...');
    await query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS duration_start DATE,
      ADD COLUMN IF NOT EXISTS duration_end DATE
    `);
    console.log('✅ Spalten duration_start und duration_end hinzugefügt (NULL erlaubt)');

    // 2. Dokumentation
    await query(`
      COMMENT ON COLUMN bookings.duration_start IS 
      'Startdatum für laufzeit-basierte Artikel-Typen (nur wenn article_type.is_campaign_based = false)'
    `);
    await query(`
      COMMENT ON COLUMN bookings.duration_end IS 
      'Enddatum für laufzeit-basierte Artikel-Typen (nur wenn article_type.is_campaign_based = false)'
    `);

    // 3. Check-Constraint: Entweder campaign_id ODER (duration_start + duration_end)
    console.log('\n2️⃣ Füge Validierungs-Constraint hinzu...');
    await query(`
      DO $$
      BEGIN
        -- Entferne alten Constraint falls vorhanden
        IF EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'chk_bookings_campaign_or_duration'
        ) THEN
          ALTER TABLE bookings DROP CONSTRAINT chk_bookings_campaign_or_duration;
        END IF;

        -- Neuer Constraint: Entweder campaign_id ODER beide duration-Felder
        ALTER TABLE bookings
        ADD CONSTRAINT chk_bookings_campaign_or_duration CHECK (
          (campaign_id IS NOT NULL AND duration_start IS NULL AND duration_end IS NULL) OR
          (campaign_id IS NULL AND duration_start IS NOT NULL AND duration_end IS NOT NULL) OR
          (campaign_id IS NULL AND duration_start IS NULL AND duration_end IS NULL)
        );
      END$$;
    `);
    console.log('✅ Constraint hinzugefügt: Entweder Kampagne ODER Laufzeit');

    // 4. Index für Duration-Abfragen
    console.log('\n3️⃣ Erstelle Indizes für Duration-Queries...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_duration_start ON bookings(duration_start);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_duration_end ON bookings(duration_end);
    `);
    console.log('✅ Indizes erstellt');

    // 5. Zeige aktuelle Struktur
    const columns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
        AND column_name IN ('campaign_id', 'duration_start', 'duration_end')
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Bookings-Spalten (Kampagne/Laufzeit):');
    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '✅ NULL' : '⚠️  NOT NULL';
      console.log(`  - ${col.column_name} (${col.data_type}) ${nullable}`);
    });

    console.log('\n💡 Verwendung:');
    console.log('  Kampagnen-basiert: campaign_id = X, duration_start/end = NULL');
    console.log('  Laufzeit-basiert:  campaign_id = NULL, duration_start = \'2025-01-01\', duration_end = \'2025-12-31\'');

    console.log('\n🎯 Nächster Schritt: Backend-Logik anpassen');
    console.log('   - Booking-Model erweitern (validate, create, update)');
    console.log('   - Availability-Check für Duration-Ranges');

    console.log('\n🎉 Bookings Schema-Update abgeschlossen!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fehler:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
