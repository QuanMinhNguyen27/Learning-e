import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

const items = [
  {
    type: 'mv',
    title: 'Perfect (Ed Sheeran)',
    video: 'https://www.youtube.com/embed/2Vv-BfVoq4g',
    thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
    lyrics: `I found a love, for me
Darling, just dive right in and follow my lead
Well, I found a girl, beautiful and sweet
Oh, I never knew you were the someone waiting for me
'Cause we were just kids when we fell in love
Not knowing what it was
I will not give you up this time
But darling, just kiss me slow
Your heart is all I own
And in your eyes, you're holding mine
Baby, I'm dancing in the dark
With you between my arms
Barefoot on the grass
Listening to our favourite song
When you said you looked a mess
I whispered underneath my breath
But you heard it
Darling, you look perfect tonight
♪
Well, I found a woman, stronger than anyone I know
She shares my dreams, I hope that someday I'll share her home
I found a lover, to carry more than just my secrets
To carry love, to carry children of our own
We are still kids, but we're so in love
Fighting against all odds
I know we'll be alright this time
Darling, just hold my hand
Be my girl, I'll be your man
I see my future in your eyes
Baby, I'm dancing in the dark
With you between my arms
Barefoot on the grass
Listening to our favorite song
When I saw you in that dress, looking so beautiful
I don't deserve this
Darling, you look perfect tonight
♪
(No, no, no)
♪
Baby, I'm dancing in the dark
With you between my arms
Barefoot on the grass
Listening to our favorite song
I have faith in what I see
Now I know I have met an angel in person
And she looks perfect
I don't deserve this
You look perfect tonight`
  },
  {
    type: 'mv',
    title: 'See You Again (Wiz Khalifa ft. Charlie Puth)',
    video: 'https://www.youtube.com/embed/RgKAFK5djSk',
    thumbnail: 'https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg',
    lyrics: `It's been a long day without you, my friend
And I'll tell you all about it when I see you again
We've come a long way from where we began
Oh, I'll tell you all about it when I see you again
When I see you again
Damn, who knew?
All the planes we flew, good things we been through
That I'd be standin' right here talkin' to you
'Bout another path, I know we loved to hit the road and laugh
But somethin' told me that it wouldn't last
Had to switch up, look at things different, see the bigger picture
Those were the days, hard work forever pays
Now I see you in a better place (see you in a better place)
Uh
How can we not talk about family when family's all that we got?
Everythin' I went through, you were standin' there by my side
And now you gon' be with me for the last ride
It's been a long day without you, my friend
And I'll tell you all about it when I see you again (I'll see you again)
We've come a long way (yeah, we came a long way)
From where we began (you know where we started)
Oh, I'll tell you all about it when I see you again (let me tell you)
When I see you again
Oh, oh
Ooh (yeah)
First, you both go out your way and the vibe is feelin' strong
And what's small turned to a friendship, a friendship turned to a bond
And that bond'll never be broken, the love will never get lost
(The love never get lost)
And when brotherhood come first, then the line'll never be crossed
Established it on our own when that line had to be drawn
And that line is what we reached, so remember me when I'm gone
(Remember me when I'm gone)
How can we not talk about family when family's all that we got?
Everythin' I went through, you were standin' there by my side
And now you gon' be with me for the last ride
So let the light guide your way, yeah
Hold every memory as you go
And every road you take
Will always lead you home, home
It's been a long day without you, my friend
And I'll tell you all about it when I see you again
We've come a long way from where we began
Oh, I'll tell you all about it when I see you again
When I see you again
Oh (uh), oh (yeah-yeah, yeah)
Ooh (yo, yo, uh)
When I see you again (see you again, yeah, yeah)
Oh (yeah), oh (yeah, yeah, oh-oh)
Ooh (uh-huh, yup)
When I see you again`
  },
  {
    type: 'movie',
    title: 'Sunspring (Short Sci-Fi Film)',
    video: 'https://www.youtube.com/embed/LY7x2Ihqjmc',
    thumbnail: 'https://img.youtube.com/vi/LY7x2Ihqjmc/hqdefault.jpg',
    lyrics: `- In a future with mass unemployment

young people are forced to sell blood.

It's something I can do.

- You should see the boy and shut up.

I was the one who was

going to be 100 years old.

- I saw him again.

The way you were sent to me,

that was a big, honest, idea.

I am not a bright light.

- Well, I have to go to the Skull.

I don't know.

Whoa.

- What do you mean?

- Well, I don't know

anything about any of this.

- Uh, then what?

- There's no answer.

- We're going to see the money.

- Alright, you can't tell me that.

- Yeah, I was coming

to that thing, you know

because you're so pretty.

- I don't know.

I don't know what you're talking about.

- That's right.

- So, uh,

what are you doing?

- I don't want to be honest with you.

- You don't have to be a doctor.

- I'm not sure.

I don't know what you're talking about.

- I wanna see you too.

- What do you mean?

- I'm sure you wouldn't even touch me.

- I don't know what you're talking about.

- Principle.

Is completely constructed

of the same time.

- It's all about you to be true.

- You didn't even watch the

movie with the rest of the base.

- I don't know.

- I don't care.

- I know, it's a consequence.

Whatever you need to know,

about the presence of the story

I'm a little bit of the boy on the floor.

- I don't know.

I need you to explain to me what you say.

- What do you mean?

- 'Cause I don't know

what you're talking about.

- That?

That was all the time.

- Would have been a good time.

I think I could have been my life.

It may never be forgiven.

But that is just too bad.

I need to leave.

And I'm not free of the world.

- Yes, perhaps I should take it from here?

I'm not gonna do something.

- It's not a dream.

But I've got a time to stay there.

- Well I still think that you

could be back on the table.

- It's a damned thing scared to say.

Nothing is going to be a thing.

But I'm the one who got

on this rock with a child

and then I left the other two.

♪ I was a boy ♪

♪ I was a stranger ♪

♪ And I promise to be so happy ♪

♪ I was a ♪

♪ Beautiful day ♪

♪ I was taller ♪

I just wanted to tell you

♪ talk that I was born ♪

That I was much better than he did

♪ And I was ♪

♪ Ready to go ♪

I had to stop him.

I couldn't even tell.

♪ And the truth was so long ago ♪

♪ I was so happy and blue ♪

♪ I was thinking of you ♪

♪ I was a long long time ♪

♪ I was so close to you ♪

♪ I was a long time ago ♪

♪ A long long time ago ♪

♪ And I was ♪

♪ Ready to go ♪

♪ I was a ♪

♪ Home on the road ♪

Well, there was a situation with me

and a light on the ship.

And I was trying to stop me.

He was like a baby and he was gone.

I was worried about him.

And even if he would have done it all.

He couldn't come anymore.

I didn't mean to be a virgin.

I mean,

he was weak.

I thought I'd change my mind.

He was crazy to take it out.

It was a long time ago.

He was a little late.

I was going to be a moment.

I just wanted to tell you that

I was much better than he did.

I had to stop him.

I couldn't even tell.

I didn't want to hurt him.

I'm sorry I don't like him.

I can go home and be so bad.

And I love him.

And I can get him all the way out here.

And find a square

and go to a game with him.

And she doesn't show up.

And then I'll check it out.

But I'm gonna see him.

When he gets to me.

He looks at me

and he throws me out of his eyes.

And then he says he'll go to bed with me.

The question

for us is can a computer

write a screenplay

that would win a competition?

Here, kinda quickly, is...`
  },
];

const statCards = [
  { label: "Watched Videos", value: 3, desc: "+1 this week" },
  { label: "Favorite Genre", value: "Music Videos", desc: "Based on your activity" },
  { label: "Learning Streak", value: "2 days", desc: "Keep it up!" },
];

const tabs = [
  { label: "All Content", value: "all" },
  { label: "Movies", value: "movie" },
  { label: "Songs", value: "mv" },
];

// Retro notification style
const retroToastStyle: React.CSSProperties = {
  position: 'fixed',
  top: 40,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#222',
  color: '#fff',
  border: '2px solid #ffcc00',
  borderRadius: 8,
  padding: '1rem 2rem',
  fontFamily: 'monospace',
  fontSize: '1.1rem',
  zIndex: 2000,
  boxShadow: '0 4px 24px #0008',
  textShadow: '1px 1px 0 #ffcc00',
  letterSpacing: 1,
  animation: 'retroPop 0.3s',
};

const ReturnBtn = styled.button`
  position: fixed;
  top: 24px;
  left: 24px;
  background: #fff;
  color: #16a085;
  border: 2px solid #16a085;
  border-radius: 12px;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  z-index: 2000;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: background 0.2s, color 0.2s;
  &:hover { background: #16a085; color: #fff; }
`;

const Watching = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showSave, setShowSave] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const lyricsRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{msg: string, key: number}|null>(null);
  const [showFullScript, setShowFullScript] = useState(false);
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const filteredItems = activeTab === 'all' ? items : items.filter(i => i.type === activeTab);

  // Function to stop video playback
  const stopVideo = () => {
    if (iframeRef.current) {
      try {
        // For YouTube iframes, we can't directly control playback due to cross-origin restrictions
        // But we can remove the src to stop the video
        const currentSrc = iframeRef.current.src;
        iframeRef.current.src = '';
        // Restore the src after a brief moment to maintain the iframe structure
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = currentSrc;
          }
        }, 100);
      } catch (error) {
        console.log('Could not stop video:', error);
      }
    }
  };

  // Function to handle back navigation with video stopping
  const handleBackToContent = () => {
    stopVideo();
    setSelected(null);
  };

  // Function to handle dashboard navigation with video stopping
  const handleBackToDashboard = () => {
    stopVideo();
    navigate('/dashboard');
  };

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (lyricsRef.current && lyricsRef.current.contains(range.commonAncestorContainer)) {
          const text = selection.toString().trim();
          setSelectedText(text);
          setShowSave(!!text);
        } else {
          setShowSave(false);
        }
      } else {
        setShowSave(false);
      }
    };
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  const handleSave = async () => {
    if (selectedText) {
      // Get user info from localStorage
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (!user) {
        setToast({msg: 'Please log in to save words!', key: Date.now()});
        setShowSave(false);
        window.getSelection()?.removeAllRanges();
        return;
      }
      // Check for duplicate in backend
      try {
        const res = await fetch(`/api/auth/vocabulary?userId=${user.id}`);
        const data = await res.json();
        if (Array.isArray(data) && data.some((w: any) => w.word === selectedText)) {
          setToast({msg: 'Already in Vocab Bank!', key: Date.now()});
        } else {
          // Find example sentence
          let example = 'Saved from video';
          if (selected !== null) {
            const item = filteredItems[selected];
            const text = item.lyrics;
            const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
            const found = sentences.find(s => s.toLowerCase().includes(selectedText.toLowerCase()));
            if (found) {
              example = found.trim();
            }
          }

          // Fetch Free Dictionary data for the word
          let dictionaryData = null;
          try {
            const dictionaryResponse = await fetch(`/api/auth/dictionary/${encodeURIComponent(selectedText.toLowerCase())}`);
            if (dictionaryResponse.ok) {
              dictionaryData = await dictionaryResponse.json();
            } else {
              console.log('Free Dictionary API not available, using basic data');
            }
          } catch (error) {
            console.log('Could not fetch dictionary data:', error);
          }

          // Save to backend
          const newWord = {
            userId: user.id,
            word: selectedText,
            definition: dictionaryData?.definition || selectedText,
            example,
            difficulty: 'BEGINNER',
            pronunciation: dictionaryData?.pronunciation || '',
            partOfSpeech: dictionaryData?.partOfSpeech || '',
            synonyms: dictionaryData?.synonyms || ''
          };
          const postRes = await fetch('/api/auth/vocabulary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newWord)
          });
          if (postRes.ok) {
            setToast({msg: 'Saved to Vocab Bank!', key: Date.now()});
          } else {
            setToast({msg: 'Failed to save word!', key: Date.now()});
          }
        }
      } catch (err) {
        setToast({msg: 'Error saving word!', key: Date.now()});
      }
      setShowSave(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Cleanup effect to stop video when component unmounts
  useEffect(() => {
    return () => {
      // Stop video when component unmounts
      stopVideo();
    };
  }, []);

  if (selected !== null) {
    const item = filteredItems[selected];
    const script = item.lyrics;
    const previewLength = 400;
    const displayedScript = showFullScript ? script : script.slice(0, previewLength);
    const isLong = script.length > previewLength;
    return (
      <div style={{ maxWidth: 800, margin: '3rem auto', padding: '2rem', background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', position: 'relative' }}>
        {toast && (
          <div style={retroToastStyle} key={toast.key}>{toast.msg}</div>
        )}
        <button onClick={handleBackToContent} style={{ marginBottom: 24, background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '0.5rem 1.5rem', cursor: 'pointer', fontWeight: 500 }}>Back</button>
        <h2 style={{ marginBottom: 24 }}>{item.title}</h2>
        <iframe
          ref={iframeRef}
          width="100%"
          height="400"
          src={item.video}
          title={item.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: 16, marginBottom: 32 }}
        ></iframe>
        <div ref={lyricsRef} style={{ background: '#f8f9fb', borderRadius: 12, padding: '1.5rem', fontSize: '1.1rem', color: '#333', whiteSpace: 'pre-line', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minHeight: 120 }}>
          {displayedScript}
          {isLong && !showFullScript && <span>... </span>}
          {isLong && (
            <button
              onClick={() => setShowFullScript(v => !v)}
              style={{ marginLeft: 8, color: '#16a085', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {showFullScript ? 'See less' : 'See more'}
            </button>
          )}
        </div>
        {showSave && selectedText && (
          <button
            onClick={handleSave}
            style={{
              position: 'fixed',
              left: '50%',
              top: '80%',
              transform: 'translate(-50%, 0)',
              background: '#16a085',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.7rem 1.5rem',
              fontWeight: 600,
              fontSize: '1.1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              zIndex: 1000,
              cursor: 'pointer',
              marginTop: 16
            }}
          >
            Save to Vocab Bank
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: '#f7f9fb', minHeight: '100vh', paddingBottom: 40 }}>
      <ReturnBtn onClick={handleBackToDashboard}>← Dashboard</ReturnBtn>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 2rem 0 2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 8 }}>Welcome back!</h1>
        <div style={{ color: '#5c5c5c', fontSize: '1.1rem', marginBottom: 32 }}>Continue your learning journey with videos and movies</div>
        {/* Stat Cards */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 40, flexWrap: 'wrap' }}>
          {statCards.map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '2rem 2.5rem', minWidth: 220, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 12 }}>{card.label}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#16a085', marginBottom: 6 }}>{card.value}</div>
              <div style={{ color: '#6c757d', fontSize: '1rem' }}>{card.desc}</div>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 32, borderBottom: '1.5px solid #e5e7eb', marginBottom: 24 }}>
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                fontWeight: 500,
                fontSize: '1.1rem',
                color: activeTab === tab.value ? '#16a085' : '#444',
                borderBottom: activeTab === tab.value ? '2.5px solid #16a085' : '2.5px solid transparent',
                padding: '0.7rem 0',
                cursor: 'pointer',
                transition: 'color 0.2s, border-bottom 0.2s',
                marginBottom: -1.5
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        {filteredItems.map((item, idx) => (
          <div key={item.title} style={{ background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'box-shadow 0.2s', minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => setSelected(idx)}>
            <img src={item.thumbnail} alt={item.title} style={{ width: 260, height: 146, objectFit: 'cover', borderRadius: 16, marginBottom: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
            <div style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: 12 }}>{item.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watching; 