"use strict";

const gulp = require('gulp');
const inline = require('gulp-inline');
const babel = require('gulp-babel');
const htmlmin = require('gulp-htmlmin');
const autoprefixer = require('gulp-autoprefixer')
const del = require('del')
const runSequence = require('run-sequence');
const replace = require('gulp-replace')
const gulpif = require('gulp-if');
const rename = require("gulp-rename");
const dest = '../dist'
const src = '../src'
const pkg = require('../package.json')

var isBuild = true

gulp.task('clean', function () {
  return del([dest], {force: true})
})

gulp.task('pack-html', function () {
  return gulp.src([`${src}/**/*.html`])
    .pipe(inline({
      js: [babel({
        presets: ['env'],
        "plugins": [
          "transform-custom-element-classes",
          "transform-es2015-classes"
        ]
      })],
      css: [autoprefixer({browsers: ['last 2 versions']})],
      disabledTypes: ['img'], // Only inline css files
      ignore: []
    }))
    .pipe(gulpif(isBuild, htmlmin({
      collapseWhitespace: isBuild,
      minifyJS: isBuild,
      minifyCSS: isBuild
    })))
    .pipe(replace('__widgetName__', function () {
      return pkg.name
    }))
    .pipe(rename({
      basename: pkg.name
    }))
    .pipe(gulp.dest(dest));
});

gulp.task('build', function (done) {
  runSequence('clean',
    ['pack-html'],
    done)
})


gulp.task('default', ['build'])


gulp.task('watch', function () {
  isBuild = false
  gulp.watch([`./${src}/**/*`], ['build'])
})