var stepYear = (1000 * 60 * 60 * 24 * 30 * 12);
var stepMonth = (1000 * 60 * 60 * 24 * 30);
var stepDay = (1000 * 60 * 60 * 24);
var stepHour = (1000 * 60 * 60);
var stepMinute = (1000 * 60);
var stepSecond = (1000);
var stepMillisecond = (1);

class Timeline {
	private _componentId: string;
	private _context: CanvasRenderingContext2D;
	private _width: number = 0;
	private _height: number = 0;
	private _startTimeOffset: number = -30000;
	private _endTimeOffset: number = 30000;
	private _minTimeMarkers: number = 5;
	private _maxTimeMarkers: number = 28;
	public backgroundColor: string = "#454545";
	public lineColor: string = "#ffffff";
	public fontSize: number = 12;
	public fontFamily: string = "Verdana";
	public minorLabelMaxChars: number = 10;
	public majorLabelMaxChars: number = 25;
	public frameDrawFrequency: number = 2;
	public rollingMode: boolean = false;
	private _fontWidth: number;
	private _fontHeight: number;
	private _countSinceLastDraw: number = 0;
	private _lastCalcTime: number = Date.now();

	get timeDifference(): number {
		return this._endTimeOffset - this._startTimeOffset;
	}
	
	get currentTimeOffset(): number {
		return this._startTimeOffset + this.timeDifference / 2;
	}

	get minorLabelWidth(): number {
		return this._fontWidth * this.minorLabelMaxChars
	}

	get majorLabelWidth(): number {
		return this._fontWidth * this.majorLabelMaxChars
	}

	get headerHeight(): number {
		return this._fontHeight;
	}

	constructor(componentId) {
		this._componentId = componentId;
		this.initialiseTimeline();
	}

	initialiseTimeline() {
		var canvasElement: HTMLCanvasElement = <HTMLCanvasElement>document.querySelector("#" + this._componentId);

		if (canvasElement.tagName.toLowerCase() != "canvas") throw new Error("Component ID must be a canvas element");
		if (!canvasElement.getContext) return;

		this._context = canvasElement.getContext("2d");
		this._width = canvasElement.width;
		this._height = canvasElement.height;
		
		this.calculateFontDimensions();
		
		this.drawTimeline();
	}
	
	calculateFontDimensions() {
		var domEl = document.createElement("div");
		domEl.style.fontFamily = this.fontFamily;
		domEl.style.fontSize = this.fontSize+"px";
		domEl.style.visibility = "hidden";
		domEl.style.position = "absolute";
		domEl.style.top = "-10px";
		domEl.style.left = "-10px";
		domEl.innerHTML = "0";
		document.body.appendChild(domEl);
		
		this._fontHeight = domEl.clientHeight;
		this._fontWidth = domEl.clientWidth;
		
		domEl.remove();
	}

	drawTimeline() {
		if (++this._countSinceLastDraw >= this.frameDrawFrequency) {
			this._countSinceLastDraw = 0;
			this.updateTimes();
			this.clearTimeline();
			this.drawTimeMarkers();
			this.drawCurrentTimeBar();
		}
		window.requestAnimationFrame(this.drawTimeline.bind(this));
	}
	
	updateTimes() {
		var now = Date.now();
		
		if (!this.rollingMode) {
			var timeChange = now - this._lastCalcTime;
			this._startTimeOffset += timeChange;
			this._endTimeOffset += timeChange;
		}
		
		this._lastCalcTime = now;
	}

	clearTimeline() {
		this._context.font = this.fontSize + "px " + this.fontFamily;
		this._context.fillStyle = this.backgroundColor;
		this._context.fillRect(0, 0, this._width, this._height);
	}

	drawTimeMarkers() {
		var maxMinorLabels = this._width / this.minorLabelWidth;
		var minStep = this.getMinimumStep(this.timeDifference / maxMinorLabels);

		var firstOffset = this.getCurrentTimeOffset(minStep);

		var labelCount = this.getLabelCount(minStep);
		var labelTime = this.getTimeStep(minStep);
		var labelWidth = this._width / labelCount;
		var timeWidth = labelWidth / labelTime;

		var startX = Math.ceil(firstOffset * timeWidth);
		
		var now = Date.now() - this.currentTimeOffset;
		
		for (var i = 0; i <= labelCount; i++) {
			var startPos = startX + labelWidth * i;
			this.drawMarkerLine(startPos, 0, startPos, this._height);
			var startTime = ((startPos - (this._width / 2)) / timeWidth) + now;
			
			var date = new Date(startTime);
			var dateStr = this.stringPad(date.getHours() + "") + ":" + this.stringPad(date.getMinutes() + "") + ":" + this.stringPad(date.getSeconds() + "");
			
			this._context.beginPath();
			this._context.fillStyle = this.lineColor
			this._context.textBaseline = "top";
			this._context.fillText(dateStr, startPos + 5, 0, labelWidth);
			this._context.closePath();
		}

		this.drawMarkerLine(0, this.headerHeight, this._width, this.headerHeight);
	}
	
	stringPad(padString: string, fill: string = "0", length: number = 2, left: boolean = true) {
		while (padString.length < length) {
			if (left)
				padString = fill + padString;
			else
				padString = padString + fill;
		}
		return padString
	}
	
	drawMarkerLine(startx, startY, endX, endY) {
		this._context.beginPath();
		this._context.strokeStyle = this.lineColor;
		this._context.moveTo(startx, startY);
		this._context.lineTo(endX, endY);
		this._context.stroke();
		this._context.closePath();
	}
	
	drawCurrentTimeBar() {
		if (this.currentTimeOffset < this._endTimeOffset && this.currentTimeOffset > this._startTimeOffset) {
			var startPosition = this._width / 2;
			var timeWidth = this._width / this.timeDifference;
			startPosition += timeWidth * this.currentTimeOffset;
			
			this._context.beginPath();
			this._context.strokeStyle = "yellow";
			this._context.setLineDash([10, 5]);
			this._context.moveTo(startPosition, 0);
			this._context.lineTo(startPosition, this._height);
			this._context.stroke();
			this._context.setLineDash([]);
			this._context.closePath();
		}
	}
	
	getMinimumStep(minimumStep): { scale: string, step: number } {
		if (minimumStep == undefined) {
			return;
		}

		var scale: string = 'year';
		var stepVal: number = 1000;
		
		if (stepYear * 500 > minimumStep) { scale = 'year'; stepVal = 500; }
		if (stepYear * 100 > minimumStep) { scale = 'year'; stepVal = 100; }
		if (stepYear * 50 > minimumStep) { scale = 'year'; stepVal = 50; }
		if (stepYear * 10 > minimumStep) { scale = 'year'; stepVal = 10; }
		if (stepYear * 5 > minimumStep) { scale = 'year'; stepVal = 5; }
		if (stepYear > minimumStep) { scale = 'year'; stepVal = 1; }
		if (stepMonth * 3 > minimumStep) { scale = 'month'; stepVal = 3; }
		if (stepMonth > minimumStep) { scale = 'month'; stepVal = 1; }
		if (stepDay * 5 > minimumStep) { scale = 'day'; stepVal = 5; }
		if (stepDay * 2 > minimumStep) { scale = 'day'; stepVal = 2; }
		if (stepDay > minimumStep) { scale = 'day'; stepVal = 1; }
		if (stepHour * 12 > minimumStep) { scale = 'hour'; stepVal = 12; }
		if (stepHour * 4 > minimumStep) { scale = 'hour'; stepVal = 4; }
		if (stepHour > minimumStep) { scale = 'hour'; stepVal = 1; }
		if (stepMinute * 15 > minimumStep) { scale = 'minute'; stepVal = 15; }
		if (stepMinute * 10 > minimumStep) { scale = 'minute'; stepVal = 10; }
		if (stepMinute * 5 > minimumStep) { scale = 'minute'; stepVal = 5; }
		if (stepMinute > minimumStep) { scale = 'minute'; stepVal = 1; }
		if (stepSecond * 15 > minimumStep) { scale = 'second'; stepVal = 15; }
		if (stepSecond * 10 > minimumStep) { scale = 'second'; stepVal = 10; }
		if (stepSecond * 5 > minimumStep) { scale = 'second'; stepVal = 5; }
		if (stepSecond > minimumStep) { scale = 'second'; stepVal = 1; }
		if (stepMillisecond * 200 > minimumStep) { scale = 'millisecond'; stepVal = 200; }
		if (stepMillisecond * 100 > minimumStep) { scale = 'millisecond'; stepVal = 100; }
		if (stepMillisecond * 50 > minimumStep) { scale = 'millisecond'; stepVal = 50; }
		if (stepMillisecond * 10 > minimumStep) { scale = 'millisecond'; stepVal = 10; }
		if (stepMillisecond * 5 > minimumStep) { scale = 'millisecond'; stepVal = 5; }
		if (stepMillisecond > minimumStep) { scale = 'millisecond'; stepVal = 1; }
		
		return { 'scale': scale, 'step': stepVal };
	}
	
	getCurrentTimeOffset(step: {scale: string, step: number}): number {
		var now = Date.now() - this.currentTimeOffset;
		
		switch (step.scale) {
			case "year":
				return -(now % (stepYear * step.step));
			case "month":
				return -(now % (stepMonth * step.step));
			case "day":
				return -(now % (stepDay * step.step));
			case "hour":
				return -(now % (stepHour * step.step));
			case "minute":
				return -(now % (stepMinute * step.step));
			case "second":
				return -(now % (stepSecond * step.step));
			case "millisecond":
				return -(now % (stepMillisecond * step.step));
		}
	}
	
	getLabelCount(step: {scale: string, step: number}): number {
		switch (step.scale) {
			case "year":
				return this.timeDifference / (stepYear * step.step);
			case "month":
				return this.timeDifference / (stepMonth * step.step);
			case "day":
				return this.timeDifference / (stepDay * step.step);
			case "hour":
				return this.timeDifference / (stepHour * step.step);
			case "minute":
				return this.timeDifference / (stepMinute * step.step);
			case "second":
				return this.timeDifference / (stepSecond * step.step);
			case "millisecond":
				return this.timeDifference / (stepMillisecond * step.step);
		}
	}
	
	getTimeStep(step: { scale: string, step: number }): number {
		switch (step.scale) {
			case "year":
				return stepYear * step.step;
			case "month":
				return stepMonth * step.step;
			case "day":
				return stepDay * step.step;
			case "hour":
				return stepHour * step.step;
			case "minute":
				return stepMinute * step.step;
			case "second":
				return stepSecond * step.step;
			case "millisecond":
				return stepMillisecond * step.step;
		}
	}
}