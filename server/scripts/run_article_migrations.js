const { up: upArticleTypes } = require('../migrations/20231023_create_article_types');
const { up: upArticlePlatforms } = require('../migrations/20231023_create_article_platforms');

(async () => {
  try {
    console.log('🚀 Running article-related migrations...');
    await upArticleTypes();
    console.log('✅ article_types table ensured and products.article_type_id added');
    await upArticlePlatforms();
    console.log('✅ article_platforms junction table ensured and relationships migrated');
    console.log('🎉 Article migrations completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Article migrations failed:', err);
    process.exit(1);
  }
})();
