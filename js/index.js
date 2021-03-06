// Lucas's code

//NOTE: We create nodes from end to start because we are essentially a linked list
//Create audio context and canvas contexts
//TODO: google chrome!
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//var canvasCtx = document.getElementById('canvas').getContext('2d');
navigator.getUserMedia = (
	navigator.getUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia ||
	navigator.msGetUserMedia);

//Create analyser node
var analyser = audioCtx.createAnalyser();

//set 1024 datapoints
analyser.fftSize = 2048;
var DPToHzScaleFactor =  analyser.frequencyBinCount / 20000;

//Creates input node
//need to wait until truthy callback occurs
var audioSrc;
if (navigator.getUserMedia) {
	console.log('getUserMedia supported.');
	navigator.getUserMedia(
		{audio: true},
		function (mediaStream) {
			audioSrc = audioCtx.createMediaStreamSource(mediaStream);
			audioSrc.connect(analyser);
			//make call to rest of function
		},
		function (mediaStreamErr) {
			console.log("No audio stream found.");
			console.log(mediaStreamErr);
		}
	);
} else {
	console.log('getUserMedia unsupported?');
}


//(analyser.fftSize / 8):: about 0 - 2500
//range (Hz) of the audio
//NOTE: MAX_FREQ needs to be an int!
var MAX_FREQ = Math.round(analyser.frequencyBinCount / 22);

//frequency data points
var dataArray = new Uint8Array(MAX_FREQ);

//number of distinct recognizable regions
//NUM_REGIONS cannot be greater than MAX_FREQ or no bars will be drawn
var NUM_REGIONS = 2;
if (NUM_REGIONS > MAX_FREQ) {
	NUM_REGIONS = MAX_FREQ
}

//coll of regions
var freqRegions = new Uint8Array(NUM_REGIONS);

//we cut off the highest frequencies in MAX_FREQ by rounding
var REGION_SIZE = Math.floor(MAX_FREQ / NUM_REGIONS);

/*var WIDTH = canvas.width;
var HEIGHT = canvas.height;*/
//canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);


var threshold = 120;
function checkLowFreq (height) {
	if (height > threshold) {
		//yuda fn
		startWalking();
	} else {
		stopWalking();
	}
}

function checkHighFreq (height) {
	if (height > threshold) {
		//yuda fn
		startJump();
	} else {
		stopJump();
	}
}

function thresholdCheck (barHeight, regionIndex) {
	if (regionIndex === 0) {
		checkLowFreq(barHeight);
	} else if (regionIndex === 1) {
		checkHighFreq(barHeight);
	}
}

//freq range is non-dynamic at about 20 - 2870 Hz
function draw() {
	//drawVisual = requestAnimationFrame(draw);

	analyser.getByteFrequencyData(dataArray);

/*	canvasCtx.fillStyle = 'rgb(0, 0, 0)';
	canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);*/

//	var barWidth = (WIDTH / NUM_REGIONS);
	var barHeight;
//	var x = 0;

	var regionTotal = 0;
	//loop through all data points in each moment, excluding the floored amounts at the high end
	for (var i = 2; i < REGION_SIZE * NUM_REGIONS; i++) {
		//(i * NUM_REGIONS) / MAX_FREQ
		//converts the index from arr of MAX_FREQ to arr of NUM_REGIONS
		var freqRegionIndex = Math.floor(i * NUM_REGIONS / MAX_FREQ);

		//devalues audio where vocals may overlap
		//NOTE: handles ONLY 2 regions
		var vocalOverlapIndex = Math.abs((MAX_FREQ / 2) - i);
		if (vocalOverlapIndex < 12) {
			regionTotal += dataArray[i] * (vocalOverlapIndex / 12);
		} else {
			regionTotal += dataArray[i];
		}

		//if flawed, bars will be incorrect and/or missing
		//index attempts to check last position in a region
		if (i % REGION_SIZE === REGION_SIZE - 1) {
			regionTotal /= REGION_SIZE;
			freqRegions[freqRegionIndex] = regionTotal;
			//reset aggregate to 0
			regionTotal = 0;
			//create a bar height
			barHeight = freqRegions[freqRegionIndex];
			//plot the bar
/*			canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
			canvasCtx.fillRect(x, HEIGHT - barHeight/2, barWidth, barHeight/2); */
			thresholdCheck(barHeight, freqRegionIndex);

			//move x to next bar pos
//			x += barWidth + 1;
		}
	}
};

/*
//brute force implementation
function findVocalCenter() {
	var largestIndex = 0;
	var largestAvg = 0;
	//loop through using approx 5n additions to find most significant freq area
	//  return it as the vocal center.
	for (var i = 0; i < REGION_SIZE * NUM_REGIONS - 4; i++) {
		var agg = 0;
		for (var j = 0; j < 5; j++) {
			agg += dataArray[i + j];
		}
		agg /= 5;
		if (largestAvg < agg) {
			largestIndex = i;
			largestAvg = agg;
		}
	}

	return largestIndex;
}

//Returns an approximate centering for some vocals (as an index)
//In: A left bound, a width within which to fit the vocal
function centerVocals(freqWidth, minPotentialFreq, maxPotentialFreq) {
	var sum = 0;
	//40 is arb. > values should result in > precision.
	for (var i = 0; i < 10000; i++) {
		//NOTIFY the player that they need to make their sound
		analyser.getByteFrequencyData(dataArray);
		sum += findVocalCenter();
		console.log([i, minPotentialFreq]);
	}
	//we use avg as an index into dataArray
	//avg * DPToHzScaleFactor = Semi-correct frequency in Hz
	var avg = sum / 200;

	var avgInHz = avg * DPToHzScaleFactor;

	//make sure scaling won't overlap elsewhere
	if (avgInHz < minPotentialFreq) {
		return (avgInHz + freqWidth/2) / DPToHzScaleFactor;
	} else if (avgInHz > maxPotentialFreq) {
		return (avgInHz - freqWidth/2) / DPToHzScaleFactor;
	}
	return Math.round(avg);
} */

//assign indices to the different vocals.
//bassline and melody always 1464.84
//var bassline = centerVocals(150, 50, MAX_FREQ * DPToHzScaleFactor);
//var melody   = centerVocals(150, bassline * DPToHzScaleFactor, MAX_FREQ * DPToHzScaleFactor);

//draw();
