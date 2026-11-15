// Provisional platform speech, always paired with captions. No NASA voice/recording.
export class ArchiveVoice {
  status='caption-only';
  lastText='';
  spokenLines=0;
  lastError='';
  speak(text:string,volume:number):void {
    this.cancel();this.lastText=text;
    if(!('speechSynthesis' in window)||volume<=0||text.startsWith('[')){this.status='caption-only';return;}
    const synth=window.speechSynthesis;
    const message=new SpeechSynthesisUtterance(text);message.lang='en-US';message.rate=.9;message.volume=Math.min(1,volume);
    const voice=synth.getVoices().find(v=>v.lang.startsWith('en')&&v.localService);
    if(voice)message.voice=voice;
    message.onstart=()=>{this.status='speaking';this.spokenLines++;};message.onend=()=>{this.status='finished';};message.onerror=(event)=>{this.lastError=event.error;this.status='caption-only';};
    this.status='requested';synth.speak(message);
  }
  pause():void{if('speechSynthesis' in window)window.speechSynthesis.pause();}
  resume():void{if('speechSynthesis' in window)window.speechSynthesis.resume();}
  cancel():void{if('speechSynthesis' in window)window.speechSynthesis.cancel();}
}
