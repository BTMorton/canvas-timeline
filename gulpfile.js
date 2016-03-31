var gulp = require('gulp');
var typescript = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var merge = require('merge2');

var tsProject = typescript.createProject({
	"target": "ES5",
	"sourceMap": true,
	"noImplicitAny": false,
	"declarationFiles": true
});

gulp.task('default', ['ts', 'html', 'js']);

gulp.task('ts', function () {
	var tsResult = gulp.src('src/*.ts')
		.pipe(sourcemaps.init())
		.pipe(typescript(tsProject));

	return merge([
		tsResult.js.pipe(sourcemaps.write()).pipe(gulp.dest('dist')),//.pipe(uglify()).pipe(rename({extname: '.min.js'})).pipe(gulp.dest('dist')),
		tsResult.dts.pipe(gulp.dest('dist'))
	]);
});
gulp.task('html', function () {
	return gulp.src('src/*.html').pipe(gulp.dest('dist'));
});
gulp.task('js', function () {
	return gulp.src('src/*.js').pipe(gulp.dest('dist'));
});