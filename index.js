var pathModule = require('path');
var loaderUtils = require('loader-utils');
var gutil = require('gulp-util');

var ProcessorEngine = require('./lib/ProcessorEngine');
var Angular1Processor = require('./lib/Angular1Processor');
var utils = require('./lib/utils');

const PLUGIN_NAME = 'angular-resolve-relative-template-urls-loader';

// console.log('HEREHERHEHRHERHEHREH')
let first = true;
module.exports = function (rawFileContent) {

    const options = loaderUtils.getOptions(this) || {};
    const loaderCompleteCallback = this.async();

    if (options.basePath == null) {
        throw new PluginError(PLUGIN_NAME, 'options.basePath must be specified. Otherwise the plugin cannot resolve an absolute path to the templates');
    }
    options.transformUrl = options.transformUrl || function (templateUrl) { return templateUrl; };
    options.basePath = pathModule.resolve(options.basePath);
    options.processors = [new Angular1Processor()];

    var logger = options.logger = utils.createLogger();
    if (options.debug !== true) {
        logger.debug = function () {}
    }
    delete options.debug;
    logger.warn = function(msg) {
        gutil.log(
            PLUGIN_NAME,
            gutil.colors.yellow('[Warning]'),
            gutil.colors.magenta(msg)
        );
    };

    var skipFiles = options.skipFiles || function() {return false;};
    delete options.skipFiles;
    if (typeof skipFiles === 'function') {
        /* OK */
    } else if (skipFiles instanceof RegExp) {
        var regexp = skipFiles;
        skipFiles = function(file) {
            return regexp.test(file.path);
        }
    } else {
        logger.warn('"skipFiles" options should be either function or regexp, actual type is ' + typeof skipFiles);
        skipFiles = function() {return false;}
    }

    var processorEngine = new ProcessorEngine();
    processorEngine.init(options);

    // /**
    //  * This function is 'through' callback, so it has predefined arguments
    //  * @param {File} file file to analyse
    //  * @param {String} enc encoding (unused)
    //  * @param {Function} cb callback
    //  */
    // function transform(file, enc, cb) {
    //     // ignore empty files
    //     if (file.isNull()) {
    //         cb(null, file);
    //         return;
    //     }

    //     if (file.isStream()) {
    //         throw new PluginError(PLUGIN_NAME, 'Streaming not supported. particular file: ' + file.path);
    //     }

    //     logger.debug('\n\nfile.path: %s', file.path || 'fake');

    //     if (skipFiles(file)) {
    //         logger.info('skip file %s', file.path);
    //         cb(null, file);
    //         return;
    //     }

    //     var pipe = this;
    //     processorEngine.process(file, cb, function onErr(msg) {
    //         pipe.emit('error', new PluginError(PLUGIN_NAME, msg));
    //     });
    // }


    // return through.obj(transform);
    // const file =


    const file = {
        path: this.resourcePath,
        contents: rawFileContent,
    }

    processorEngine.process(file, onFileProcessed, onFileProcessingError);

    function onFileProcessed() {
        loaderCompleteCallback(null, file.contents);
    }

    function onFileProcessingError(errorMessage) {
        loaderCompleteCallback(new Error(errorMessage));
    }
};