const { query } = require('../config/database');

class Article {
  static async findAllByPlatform(platformKey) {
    const result = await query(
      'SELECT * FROM articles WHERE platform_key = $1 ORDER BY name',
      [platformKey]
    );
    return result.rows;
  }

  static async findByPlatformAndKey(platformKey, key) {
    const result = await query(
      'SELECT * FROM articles WHERE platform_key = $1 AND key = $2',
      [platformKey, key]
    );
    return result.rows[0];
  }

  static async create(data) {
    const { platform_key, key, name, description, article_type = 'standard' } = data;
    const result = await query(
      `INSERT INTO articles (platform_key, key, name, description, article_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [platform_key, key, name, description, article_type]
    );
    return result.rows[0];
  }

  static async update(platformKey, key, data) {
    const result = await query(
      `UPDATE articles 
       SET name = $1, description = $2, article_type = $3, updated_at = NOW()
       WHERE platform_key = $4 AND key = $5
       RETURNING *`,
      [data.name, data.description, data.article_type, platformKey, key]
    );
    return result.rows[0];
  }

  static async delete(platformKey, key) {
    await query(
      'DELETE FROM articles WHERE platform_key = $1 AND key = $2',
      [platformKey, key]
    );
  }
}

module.exports = Article;