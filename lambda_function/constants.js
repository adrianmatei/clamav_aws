const CLAMAV_DEFINITIONS_FILES = ['main.cvd', 'daily.cvd', 'bytecode.cvd'];
const CLAMAV_BUCKET_NAME       = 'clam-av-files-bucket';
const PATH_TO_AV_DEFINITIONS   = 'virus_definitions';
const PATH_TO_CLAMAV = './clamscan';
const STATUS_CLEAN_FILE = process.env.STATUS_CLEAN_FILE || 'CLEAN';
const STATUS_INFECTED_FILE = process.env.STATUS_INFECTED_FILE || 'INFECTED';
const STATUS_ERROR_PROCESSING_FILE = process.env.STATUS_ERROR_PROCESSING_FILE || 'ERROR';
const VIRUS_SCAN_STATUS_KEY = process.env.VIRUS_SCAN_STATUS_KEY || 'av-status';
const VIRUS_SCAN_TIMESTAMP_KEY = process.env.VIRUS_SCAN_TIMESTAMP_KEY || 'av-timestamp';
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '314572800';
const STATUS_SKIPPED_FILE = process.env.STATUS_SKIPPED_FILE || 'SKIPPED';
const INFECTED_DIR_NAME = "infected";
const DUMMY_PDF_FILE_NAME = "ReplacementVirus.pdf";
const ASSET_PATH = "./assets/";
const FILE_TYPE = "FILE_TYPE";
const DUMMY_PDF_REPLACEMENT = "REPLACEMENT_VIRUS_PDF";

module.exports = {
    CLAMAV_BUCKET_NAME          : CLAMAV_BUCKET_NAME,
    PATH_TO_AV_DEFINITIONS      : PATH_TO_AV_DEFINITIONS,
    PATH_TO_CLAMAV              : PATH_TO_CLAMAV,
    STATUS_CLEAN_FILE           : STATUS_CLEAN_FILE,
    STATUS_INFECTED_FILE        : STATUS_INFECTED_FILE,
    STATUS_ERROR_PROCESSING_FILE: STATUS_ERROR_PROCESSING_FILE,
    CLAMAV_DEFINITIONS_FILES    : CLAMAV_DEFINITIONS_FILES,
    VIRUS_STATUS_STATUS_KEY     : VIRUS_SCAN_STATUS_KEY,
    VIRUS_SCAN_TIMESTAMP_KEY    : VIRUS_SCAN_TIMESTAMP_KEY,
    STATUS_SKIPPED_FILE         : STATUS_SKIPPED_FILE,
    MAX_FILE_SIZE               : MAX_FILE_SIZE,
    INFECTED_DIR_NAME           : INFECTED_DIR_NAME,
    DUMMY_PDF_FILE_NAME         : DUMMY_PDF_FILE_NAME,
    ASSET_PATH                  : ASSET_PATH,
    FILE_TYPE                   : FILE_TYPE,
    DUMMY_PDF_REPLACEMENT       : DUMMY_PDF_REPLACEMENT
    
};
