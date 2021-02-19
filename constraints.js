const CLAMAV_DEFINITIONS_FILES = ['main.cvd', 'daily.cvd', 'bytecode.cvd'];
const CLAMAV_BUCKET_NAME       = 'clam-av-files-bucket';
const PATH_TO_AV_DEFINITIONS   = 'virus_definitions';

module.exports = {
    CLAMAV_BUCKET_NAME          : CLAMAV_BUCKET_NAME,
    PATH_TO_AV_DEFINITIONS      : PATH_TO_AV_DEFINITIONS,
    CLAMAV_DEFINITIONS_FILES    : CLAMAV_DEFINITIONS_FILES
};
