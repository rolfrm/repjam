function parseNumber(str) {
    const parsed = parseInt(str);
    if (isNaN(parsed)) return null;
    return parsed;
}
function parse_args(url) {
    index = url.indexOf("?");
    str = url.substring(index + 1);
    items = str.split("&");
    map = {}
    items.map(x => x.split("=")).forEach(x => map[x[0]] = x[1]);
    return map;
}

args = parse_args(document.location.search);


load_table = str => str.split("\n")
    .map(x => x.split(";").map(x => x.trim()))
    .filter(x => x.length > 0);

var countDownSound = new Audio('/media/s1.oga');
var halftimeSound = new Audio('/media/s2.wav');
balls = []
songs = []
function load_vue() {
    var app = {
        data(){
            return {
                ask: ' ',
                level: 1,
                levels: [
                    { name: 'Weasy', level: 0.5},
                    { name: 'Medium', level: 1},
                    { name: 'Hard', level: 1.5},
                    { name: 'Brutal', level: 2.0}],
                categories: [
                        {name: 'Strength', weight: 5},
                        {name: 'Cardio', weight: 5},
                        {name: 'Brain', weight: 5},
                        {name: 'Zen', weight: 5},
                        {name: 'Musc', weight: 5}                    
                    ],
                ball:'',
                display: ' ',
                subtext: "",
                countdown:"",
                states:['Active', 'Paused', 'Stopped'],
                state: 'Stopped',
                active: null

                }        
        },
        methods: {
            CountDown: function (i, action, update, active){
                if(update)
                   update(i);
                if(i > 0){
                    setTimeout(()=> {
                        if(active && active.active == false){
                            return;
                        }
                        this.CountDown(i - 1, action, update, active);
                    }, 1000);
                }else
                {
                    action();
                }
            },
            OnGo: function () {
                this.ball = ""; 
                this.state='Active';
                
                if(this.active)
                    this.active.active = false;
                this.GetNextBall();    
                this.active = {active: true};
                this.CountDown(5, ()=> this.NextBall(this.ball), i => {
                    this.countdown = i;
                    if(i == 0)
                        this.countdown = "";
                    countDownSound.play()}, this.active);
            },
            OnPause: function(){
                this.state = 'Paused';
            },
            OnStop: function(){
                this.state = 'Stopped';
            },
            CountedDone: function() {
                
                this.OnGo();
            },
            GetNextBall: function(){
                len = balls.length;
                index = Math.floor(Math.random() * len);
                console.info(len);
                nextball = balls[index];
                nextball = JSON.parse(JSON.stringify(nextball))
                if(nextball.count){
                    nextball.count = Math.floor(nextball.count * this.level);

                }else if(nextball.time){

                    nextball.time = Math.floor(nextball.time * this.level);
                    nextball.halftime = Math.floor(nextball.time / 2);

                    if(this.active)
                        this.active.active = false;
                    this.active = {active: true};

                }

                this.ball = nextball;

                if(nextball["song-list"]){
                    this.ball.song = "<song>";
                    task2 = fetch(nextball["song-list"])
                    .then(r => r.text())
                    .then(r => {
                        table = load_table(r);
                        idx = Math.floor(table.length *Math.random());
                        this.ball.song = table[idx][0];
                    })
                }
                if(this.ball.math){
                    range = parseNumber(nextball.range);
                    this.ball.a = Math.floor(Math.random() * range);
                    this.ball.b = Math.floor(Math.random() * range);
                    console.info(String(this.ball))

                }

                console.log(this.ball.name);

            },

            NextBall: function (ball) {
                if(ball.time){
                    this.CountDown(ball.time, ()=>{
                        this.OnGo();
                    }, i => {
                        ball.time = i;
                        if(i == ball.halftime){
                            halftimeSound.play();
                        }
                    }, this.active)

                }
                
            },
            handleKey: function(evt) {
                if (evt.keyCode === 13 ) {
                  this.CountedDone();
                }
              },
            Persist: function(){
                localStorage.categories = this.categories;
                localStorage.level = this.level;
                localStorage.levels = this.levels;
            }
        },
        mounted() {
            document.addEventListener('keyup', this.handleKey);
            this.GetNextBall();
            return;
            if(localStorage.categories)
                this.categories = localStorage.categories;
            if(localStorage.levels)
                this.levels = localStorage.levels;
            if(localStorage.level)
                this.level = localStorage.level;
            
         },
         unmounted(){
            document.removeEventListener('keyup', this.handleKey);
         },
         watch: {
             levels(newLevels){
                 localStorage.levels = newLevels;
             },
         }
    }

    vue = Vue.createApp(app).mount('#app');
}


task = fetch("./brainballs.json")
    .then(response => response.json())
    .then(r => balls = r);

task2 = fetch("./media/songs.data")
    .then(r => r.text())
    .then(r => songs = load_table(r))

task = task.then(async ()=> await task2).then(load_vue);
 