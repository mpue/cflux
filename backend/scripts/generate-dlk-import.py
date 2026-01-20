import csv
import uuid
from datetime import datetime

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    if s is None or s == '':
        return 'NULL'
    return f"'{s.replace(chr(39), chr(39)+chr(39))}'"

def generate_uuid():
    """Generate a UUID for database ID"""
    return str(uuid.uuid4())

# Read CSV file
csv_file = r'c:\Users\mpue\Documents\devel\cflux\docs\dlk.csv'
output_file = r'c:\Users\mpue\Documents\devel\cflux\db\import_dlk_articles.sql'

print(f"Reading CSV from: {csv_file}")

with open(csv_file, 'r', encoding='utf-8') as f:
    # Read with semicolon delimiter
    reader = csv.reader(f, delimiter=';')
    
    # Skip header
    next(reader)
    
    sql_statements = []
    sql_statements.append("-- Import DLK Articles")
    sql_statements.append(f"-- Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql_statements.append("")
    
    imported_count = 0
    skipped_count = 0
    
    for row_num, row in enumerate(reader, start=2):  # Start at 2 because we skipped header
        if len(row) < 3:
            print(f"Skipping row {row_num}: Not enough columns")
            skipped_count += 1
            continue
        
        article_number = row[0].strip()
        name = row[1].strip()
        description = row[2].strip() if len(row) > 2 and row[2].strip() else None
        
        # Skip if article number is empty or not a number
        if not article_number or article_number == '':
            print(f"Skipping row {row_num}: Empty article number")
            skipped_count += 1
            continue
        
        try:
            int(article_number)
        except ValueError:
            print(f"Skipping row {row_num}: Invalid article number '{article_number}'")
            skipped_count += 1
            continue
        
        # Skip if name is empty
        if not name or name == '':
            print(f"Skipping row {row_num}: Empty name")
            skipped_count += 1
            continue
        
        # Generate UUID for id
        article_id = generate_uuid()
        created_at = datetime.now().isoformat()
        updated_at = created_at
        
        # Create SQL statement
        sql = f"""-- Article {article_number}: {name[:50]}...
INSERT INTO articles (id, "articleNumber", name, description, unit, price, "vatRate", "isActive", "createdAt", "updatedAt")
VALUES (
  '{article_id}',
  {escape_sql_string(article_number)},
  {escape_sql_string(name)},
  {escape_sql_string(description)},
  'Dienstleistung',
  0,
  7.7,
  true,
  '{created_at}',
  '{updated_at}'
)
ON CONFLICT ("articleNumber") DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "updatedAt" = EXCLUDED."updatedAt";
"""
        sql_statements.append(sql)
        imported_count += 1
        print(f"Processed article {article_number}: {name[:50]}")

# Write SQL file
print(f"\nWriting SQL to: {output_file}")
with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print(f"\n=== Summary ===")
print(f"Total articles processed: {imported_count}")
print(f"Skipped: {skipped_count}")
print(f"SQL file generated: {output_file}")
print(f"\nTo import, run:")
print(f"psql -U <username> -d <database> -f {output_file}")
