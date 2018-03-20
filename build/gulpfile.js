"use strict";

const gulp = require('gulp');
const inline = require('gulp-inline');
const babel = require('gulp-babel');
const htmlmin = require('gulp-htmlmin');
const autoprefixer = require('gulp-autoprefixer')
const del = require('del')
const runSequence = require('run-sequence');
const gulpif = require('gulp-if');
const rename = require("gulp-rename");
const path = require('path')
const filter = require('gulp-filter');
const livereload = require('gulp-livereload');
const chalk = require('chalk')
const dirname = path.dirname(__filename)
const dest = path.join(dirname, '../dist')
const src = path.join(dirname, '../src')
const pkg = require(path.join(dirname, '../package.json'))
var isBuild = true


gulp.task('clean', function () {
  return del([dest], {force: true})
})

function fileType(extname) {
  extname = (extname[0] === '.' ? '' : '.') + extname
  return function (file) {
    return path.extname(file.path) === extname
  }
}

var isHtml = fileType('html')

gulp.task('compile', function () {
  console.log(chalk.cyan('start compiling...'))

  const htmlFilter = filter(['**/*.html']);
  return gulp.src([`${src}/app/**/*`])
    .pipe(gulpif(isHtml, inline({
      // js: [babel({
      //   presets: ['env'],
      //   "plugins": [
      //     "transform-custom-element-classes",
      //     "transform-es2015-classes"
      //   ]
      // })],
      css: [autoprefixer({browsers: ['last 2 versions']})],
      disabledTypes: ['img'], // Only inline css files
      ignore: []
    })))
    .pipe(gulpif(isHtml, htmlmin({
      collapseWhitespace: isBuild,
      minifyJS: isBuild,
      minifyCSS: isBuild
    })))
    .pipe(gulpif(isHtml, rename({
      basename: pkg.name
    })))
    .pipe(htmlFilter)
    .pipe(gulp.dest(dest))
    .pipe(livereload())
    .on('finish', function () {
      !isBuild && console.log(chalk.green('Compiled successfully'))
    });
});

gulp.task('build', function (done) {
  runSequence('clean',
    ['compile'],
    done)
})

gulp.task('default', ['build'])


gulp.task('watch', function () {
  isBuild = false
  livereload.listen();
  gulp.watch(`${src}/**/*`, ['compile'])
  console.log(chalk.magenta('start watching...'))
})


module.exports = gulp