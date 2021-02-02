
function parseNumber(str) {
    const parsed = parseFloat(str);
    if (isNaN(parsed)) return null;
    return parsed;
}
function parse_args(url) {
    index = url.indexOf("?");
    if(index == -1)
       index == url.length;
    str = url.substring(index + 1);
    items = str.split("&");
    map = {}
    items.map(x => x.split("="))
    .forEach(x=> {
        if(x.length > 1)
            map[x[0].replace(/%20/g," ")] = x[1].replace(/%20/g," ");
    }); 
    return map;
}

args = parse_args(document.location.search);


load_table = str => str.split("\n")
    .map(x => x.split(";").map(x => x.trim()))
    .filter(x => x.length > 0);

var countDownSound = new Audio('./media/s1.oga');
var halftimeSound = new Audio('./media/s2.ogg');
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
                        {name: 'Strength', weight: 3},
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
                this.Persist();
                this.ball = ""; 
                this.state='Active';
                
                if(this.active)
                    this.active.active = false;
                this.GetNextBall();    
                this.active = {active: true};
                countDownSecs = 4;
                this.CountDown(countDownSecs, ()=> this.NextBall(this.ball), i => {
                    this.countdown = i;
                    if(i == 0)
                        this.countdown = "";
                    if(i != countDownSecs)
                        countDownSound.play();
                }, this.active);
            },
            OnPause: function(){
                this.state = 'Paused';
            },
            OnStop: function(){
                this.state = 'Stopped';
            },
            CountedDone: function() {
                if(this.ball.mem){
                    // special state machine when memorize is used.
                    m = this.ball.mem;
                    if(m.index + 1 < m.items.length){
                        m.index += 1
                        m.current = m.items[m.index];
                    }else if(!m.check){
                        m.current = "Please recite"
                        m.check = "start"
                    }else if(m.check == "start"){
                        m.current = m.items.join(", ");
                        m.check = "end";
                        return;
                    }

                    if(!m.check || m.check != "end"){
                        return;
                    }
                }
                this.OnGo();
            },
            GetNextBall: function(item){
                len = balls.length;
                index = Math.floor(Math.random() * len);
                
                console.info(len);
                nextball = balls[index];
                nextball = JSON.parse(JSON.stringify(nextball))

                if(item && item.name){
                    nextball = item;
                }

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
                
                if(nextball["memorize-from"]){
                    this.ball.mem = {items: [], count: Math.floor(this.level *  6), current: "A", index: -1}
                    fetch(nextball["memorize-from"])
                    .then(r => r.text())
                    .then(r => {
                        items = load_table(r);
                        for(i = 0; i < this.ball.mem.count; i++){
                            idx = Math.floor(items.length *Math.random());
                            this.ball.mem.items.push(items[idx][0]);
                        }
                        this.CountedDone();
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
                if(document.activeElement && document.activeElement.type == "submit")
                    return;
                if (evt.keyCode === 13 ) {
                  this.CountedDone();
                }
              },
            Persist: function(){
                localStorage.categories = JSON.stringify(this.categories);
                localStorage.level = this.level;
            }
        },
        mounted() {
            document.addEventListener('keyup', this.handleKey);
 
            if(localStorage.level)
                this.level = parseNumber(localStorage.level);
            if(localStorage.categories)
                this.categories = JSON.parse(localStorage.categories);
            this.GetNextBall();
            if(args['ball']){
                
                ball = balls.filter(x => x.name === args['ball'])[0]
                if(ball){
                    this.GetNextBall(ball);
                    this.state='Active';
                }
            }
            
         },
         unmounted(){
            document.removeEventListener('keyup', this.handleKey);
         },
         watch: {
             categories(newCategories){
                
             },
             level(newLevel){
              
             }
         }
    }

    vue = Vue.createApp(app).mount('#app');
}


task = fetch("./exercises.hjson")
    .then(response => response.text())
    .then(r => {
      balls = Hjson.parse(r);
    });

task2 = fetch("./media/songs.data")
    .then(r => r.text())
    .then(r => songs = load_table(r))

task = task.then(async ()=> await task2).then(load_vue);
 