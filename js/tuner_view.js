class TunerView {

	constructor(id = "tuner_view_id", width = 1000, range = musicKit.piano_range) {

	  	this.id = id;
		this.min_midi_value = range.min;
		this.max_midi_value = range.max;
	
		this.WIDTH = 1000;
		this.HEIGHT = 30;

		this.root_view = document.getElementById(this.id);
		this.root_view.style.position = "relative"
		this.root_view.style.width = this.WIDTH  + "px";
		this.root_view.style.height = this.HEIGHT  + "px";
		this.root_view.width = this.WIDTH;
		this.root_view.height = this.HEIGHT

		this.canvas = this.buildCanvas("tuner_canvas_"+this.id);
	
		this.draw();
		this.resize(width);
	}

	buildCanvas(id) {

		let canvas = document.createElement('canvas'); 
	    canvas.id = id;
	    canvas.style.position = "absolute"
	    canvas.style.left = "0px"
	    canvas.style.right = "0px"
	    canvas.style.width = this.WIDTH + "px";
		canvas.style.height = this.HEIGHT + "px";
		canvas.width = this.WIDTH;
		canvas.height = this.HEIGHT;
	    this.root_view.appendChild(canvas);
	    return canvas;
	}

	resize(newWidth){

		var newWidth = Math.min(newWidth, this.WIDTH);
		let newHeight = newWidth * (this.HEIGHT/this.WIDTH);

		let views = [this.root_view, this.canvas];
		for (let i = 0; i < views.length; i++) {
			let view = views[i];
			view.style.height = newHeight + "px";
			view.style.width = newWidth + "px";
		}
	}

	draw(frequency = 261.63){

		let ctx = this.canvas.getContext("2d");
		ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

		ctx.beginPath();
		ctx.lineWidth = 2;
		ctx.fillStyle = "#000";
		ctx.strokeStyle = "#333";
		ctx.rect(0, 0, this.WIDTH, this.HEIGHT);
		ctx.fill();
		ctx.stroke();

		let spacing = this.WIDTH * 0.10;
		let min_frequency = musicKit.all_notes[this.min_midi_value].frequency;
		let max_frequency = musicKit.all_notes[this.max_midi_value].frequency;
		let log2_min_frequency = Math.log2(min_frequency);
		let percentage = (Math.log2(frequency) - log2_min_frequency) / (Math.log2(max_frequency) - log2_min_frequency);
		let total_length = spacing * (this.max_midi_value - this.min_midi_value);
		let offset = (this.WIDTH * 0.5) + (-1 * (percentage * total_length));
		

		var xPosition = offset;

		var i;
		for(i = this.min_midi_value; i <= this.max_midi_value; i++){

			if(xPosition < -15|| xPosition > this.WIDTH+15){
				xPosition = xPosition + spacing
				continue;
			}

			var note = musicKit.all_notes[i];
		
			ctx.fillStyle = '#fff';
	    	ctx.font = (this.HEIGHT * 0.8) + 'px san-serif';
	    	ctx.textAlign = 'center';
	    	ctx.fillText(note.note_name.type.substring(0,2), xPosition, this.HEIGHT*0.75);
	    	xPosition = xPosition + spacing
		}

		ctx.beginPath();
		ctx.strokeStyle = '#888';
		ctx.lineWidth = 2;
		ctx.moveTo(this.WIDTH * 0.5, 0);
		ctx.lineTo(this.WIDTH * 0.5, this.HEIGHT);
		ctx.stroke();
	}
}