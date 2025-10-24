const { query } = require('../config/database');

(async () => {
  try {
    console.log('🔧 Erweitere article_types um is_campaign_based Flag...');

    // 1. Spalte hinzufügen falls nicht vorhanden
    console.log('\n1️⃣ Füge is_campaign_based Spalte hinzu...');
    await query(`
      ALTER TABLE article_types 
      ADD COLUMN IF NOT EXISTS is_campaign_based BOOLEAN NOT NULL DEFAULT true
    `);
    console.log('✅ Spalte is_campaign_based hinzugefügt (DEFAULT true = kampagnen-basiert)');

    // 2. Dokumentation in description hinzufügen
    await query(`
      COMMENT ON COLUMN article_types.is_campaign_based IS 
      'TRUE = Kampagnen-basiert (campaign_id erforderlich), FALSE = Laufzeit-basiert (duration_start/end erforderlich)'
    `);

    // 3. Aktuelle Artikel-Typen anzeigen
    const types = await query(`
      SELECT id, name, is_campaign_based, created_at 
      FROM article_types 
      ORDER BY name ASC
    `);

    console.log('\n📋 Aktuelle Artikel-Typen:');
    types.rows.forEach(type => {
      const mode = type.is_campaign_based ? '📅 Kampagnen-basiert' : '⏱️  Laufzeit-basiert';
      console.log(`  ${mode} - ${type.name} (ID: ${type.id})`);
    });

    console.log('\n💡 Hinweis:');
    console.log('  - Alle bestehenden Artikel-Typen sind standardmäßig KAMPAGNEN-BASIERT');
    console.log('  - Für laufzeit-basierte Typen manuell auf FALSE setzen:');
    console.log('    UPDATE article_types SET is_campaign_based = false WHERE name = \'...\';');
    console.log('');
    console.log('🎯 Nächster Schritt: Bookings-Tabelle mit duration_start/duration_end erweitern');
    console.log('   (siehe fix_bookings_add_duration.js)');

    console.log('\n🎉 Article-Types Schema-Update abgeschlossen!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fehler:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
