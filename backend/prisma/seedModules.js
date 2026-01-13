"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedModules = seedModules;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
/**
 * Seed script to initialize default modules in the system
 */
function seedModules() {
    return __awaiter(this, void 0, void 0, function () {
        var modules, _i, modules_1, module_1, existing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Seeding modules...');
                    modules = [
                        {
                            name: 'Dashboard',
                            key: 'dashboard',
                            description: 'Übersichtsseite mit wichtigen Informationen',
                            icon: 'dashboard',
                            route: '/',
                            sortOrder: 0,
                        },
                        {
                            name: 'Zeiterfassung',
                            key: 'time_tracking',
                            description: 'Zeit- und Anwesenheitsverwaltung',
                            icon: 'schedule',
                            route: '/time',
                            sortOrder: 1,
                        },
                        {
                            name: 'Projekte',
                            key: 'projects',
                            description: 'Projektverwaltung',
                            icon: 'folder',
                            route: '/projects',
                            sortOrder: 2,
                        },
                        {
                            name: 'Kunden',
                            key: 'customers',
                            description: 'Kundenverwaltung',
                            icon: 'people',
                            route: '/customers',
                            sortOrder: 3,
                        },
                        {
                            name: 'Lieferanten',
                            key: 'suppliers',
                            description: 'Lieferantenverwaltung',
                            icon: 'local_shipping',
                            route: '/suppliers',
                            sortOrder: 4,
                        },
                        {
                            name: 'Artikel',
                            key: 'articles',
                            description: 'Artikel- und Produktverwaltung',
                            icon: 'inventory',
                            route: '/articles',
                            sortOrder: 5,
                        },
                        {
                            name: 'Rechnungen',
                            key: 'invoices',
                            description: 'Rechnungsverwaltung',
                            icon: 'receipt',
                            route: '/invoices',
                            sortOrder: 6,
                        },
                        {
                            name: 'Mahnungen',
                            key: 'reminders',
                            description: 'Mahnwesen',
                            icon: 'warning',
                            route: '/reminders',
                            sortOrder: 7,
                        },
                        {
                            name: 'Abwesenheiten',
                            key: 'absences',
                            description: 'Urlaubsverwaltung und Abwesenheiten',
                            icon: 'event_busy',
                            route: '/absences',
                            sortOrder: 8,
                        },
                        {
                            name: 'Berichte',
                            key: 'reports',
                            description: 'Auswertungen und Berichte',
                            icon: 'assessment',
                            route: '/reports',
                            sortOrder: 9,
                        },
                        {
                            name: 'Compliance',
                            key: 'compliance',
                            description: 'Arbeitszeit-Compliance (Schweiz)',
                            icon: 'policy',
                            route: '/compliance',
                            sortOrder: 10,
                        },
                        {
                            name: 'Vorfälle',
                            key: 'incidents',
                            description: 'Incident Management',
                            icon: 'bug_report',
                            route: '/incidents',
                            sortOrder: 11,
                        },
                        {
                            name: 'Benutzer',
                            key: 'users',
                            description: 'Benutzerverwaltung',
                            icon: 'person',
                            route: '/users',
                            sortOrder: 12,
                        },
                        {
                            name: 'Benutzergruppen',
                            key: 'user_groups',
                            description: 'Benutzergruppenverwaltung',
                            icon: 'groups',
                            route: '/user-groups',
                            sortOrder: 13,
                        },
                        {
                            name: 'Module',
                            key: 'modules',
                            description: 'Modulverwaltung und Berechtigungen',
                            icon: 'apps',
                            route: '/modules',
                            sortOrder: 14,
                        },
                        {
                            name: 'Einstellungen',
                            key: 'settings',
                            description: 'Systemeinstellungen',
                            icon: 'settings',
                            route: '/settings',
                            sortOrder: 15,
                        },
                        {
                            name: 'Intranet',
                            key: 'intranet',
                            description: 'Intranet und Wissensdatenbank',
                            icon: 'folder_shared',
                            route: '/intranet',
                            sortOrder: 16,
                        },
                        {
                            name: 'Kostenstellen',
                            key: 'cost_centers',
                            description: 'Kostenstellenverwaltung',
                            icon: 'account_balance',
                            route: '/cost-centers',
                            sortOrder: 17,
                        },
                    ];
                    _i = 0, modules_1 = modules;
                    _a.label = 1;
                case 1:
                    if (!(_i < modules_1.length)) return [3 /*break*/, 6];
                    module_1 = modules_1[_i];
                    return [4 /*yield*/, prisma.module.findUnique({
                            where: { key: module_1.key },
                        })];
                case 2:
                    existing = _a.sent();
                    if (!!existing) return [3 /*break*/, 4];
                    return [4 /*yield*/, prisma.module.create({
                            data: module_1,
                        })];
                case 3:
                    _a.sent();
                    console.log("Created module: ".concat(module_1.name));
                    return [3 /*break*/, 5];
                case 4:
                    console.log("Module already exists: ".concat(module_1.name));
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log('Module seeding completed!');
                    return [2 /*return*/];
            }
        });
    });
}
// Run if called directly
if (require.main === module) {
    seedModules()
        .catch(function (error) {
        console.error('Error seeding modules:', error);
        process.exit(1);
    })
        .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.$disconnect()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
}
