#!/usr/bin/env python3
"""
Script to refactor AdminDashboard.tsx into separate component files.
"""

import re

# Component mappings with their line ranges
components = [
    {"name": "UsersTab", "fileName": "UsersTab", "startLine": 359, "endLine": 728, 
     "imports": ["User", "userService", "UserDetailModal", "PDFReportModal"]},
    {"name": "LocationsTab", "fileName": "LocationsTab", "startLine": 729, "endLine": 895,
     "imports": ["Location", "locationService"]},
    {"name": "CustomersTab", "fileName": "CustomersTab", "startLine": 897, "endLine": 1224,
     "imports": ["Customer", "customerService"]},
    {"name": "SuppliersTab", "fileName": "SuppliersTab", "startLine": 1226, "endLine": 1545,
     "imports": ["Supplier", "supplierService"]},
    {"name": "ProjectsTab", "fileName": "ProjectsTab", "startLine": 1547, "endLine": 1810,
     "imports": ["Project", "projectService", "User", "userService"]},
    {"name": "AbsencesTab", "fileName": "AbsencesTab", "startLine": 1812, "endLine": 1915,
     "imports": ["AbsenceRequest", "absenceService"]},
    {"name": "TimeEntriesTab", "fileName": "TimeEntriesTab", "startLine": 1917, "endLine": 2169,
     "imports": ["TimeEntry", "timeService", "Project", "User"]},
    {"name": "ReportsTab", "fileName": "ReportsTab", "startLine": 2171, "endLine": 2404,
     "imports": ["Report"]},
    {"name": "BackupTab", "fileName": "BackupTab", "startLine": 2406, "endLine": 2649,
     "imports": ["backupService", "Backup"]},
    {"name": "HolidaysTab", "fileName": "HolidaysTab", "startLine": 2651, "endLine": 2957,
     "imports": []},
    {"name": "ComplianceTab", "fileName": "ComplianceTab", "startLine": 2959, "endLine": 3155,
     "imports": ["ComplianceViolation", "ComplianceStats"]},
    {"name": "ArticleGroupsTab", "fileName": "ArticleGroupsTab", "startLine": 3157, "endLine": 3372,
     "imports": ["ArticleGroup", "articleGroupService"]},
    {"name": "ArticlesTab", "fileName": "ArticlesTab", "startLine": 3374, "endLine": 3698,
     "imports": ["Article", "ArticleGroup", "articleService"]},
    {"name": "InvoiceTemplatesTab", "fileName": "InvoiceTemplatesTab", "startLine": 3700, "endLine": 3883,
     "imports": ["InvoiceTemplateEditor"]},
    {"name": "InvoicesTab", "fileName": "InvoicesTab", "startLine": 3885, "endLine": 4520,
     "imports": ["Invoice", "Customer", "Article", "invoiceService"]},
]

def read_lines(filepath, start, end):
    """Read specific lines from a file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        return ''.join(lines[start-1:end])

def create_component_file(name, content, imports):
    """Create a new component file with proper imports."""
    
    # Build imports
    import_lines = [
        "import React, { useState, useEffect } from 'react';",
    ]
    
    # Add type imports
    if imports:
        type_imports = [imp for imp in imports if imp[0].isupper() and 'service' not in imp.lower() and 'Modal' not in imp]
        if type_imports:
            import_lines.append(f"import {{ {', '.join(type_imports)} }} from '../../types';")
    
    # Add service imports
    service_imports = [imp for imp in imports if 'service' in imp.lower()]
    for svc in service_imports:
        if svc.endswith('Service'):
            module_name = svc.replace('Service', '')
            import_lines.append(f"import {{ {module_name}Service }} from '../../services/{module_name}.service';")
        else:
            # Handle special imports like customerService, supplierService, etc
            import_lines.append(f"import * as {svc} from '../../services/{svc}';")
    
    # Add component imports
    component_imports = [imp for imp in imports if 'Modal' in imp or 'Editor' in imp]
    for comp in component_imports:
        import_lines.append(f"import {{ {comp} }} from '../{comp}';")
    
    file_content = '\n'.join(import_lines) + '\n\n' + content + '\n'
    
    return file_content

def main():
    source_file = 'd:\\devel\\cflux\\frontend\\src\\pages\\AdminDashboard.tsx'
    output_dir = 'd:\\devel\\cflux\\frontend\\src\\components\\admin\\'
    
    print("Starting refactoring process...")
    
    for component in components:
        print(f"Extracting {component['name']}...")
        
        # Read component code
        code = read_lines(source_file, component['startLine'], component['endLine'])
        
        # Create file content
        file_content = create_component_file(component['name'], code, component['imports'])
        
        # Write to file
        output_path = output_dir + component['fileName'] + '.tsx'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
        
        print(f"  Created {output_path}")
    
    print("\nRefactoring complete!")
    print(f"Created {len(components)} component files in {output_dir}")

if __name__ == '__main__':
    main()
