import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const Saved = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await api.get('/api/food/save');
        setSaved(res.data.savedFoods || []);
      } catch (err) {
        console.error('Error fetching saved foods', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  if (loading) return <div style={{padding:20}}>Loading...</div>;
  if (!saved.length) return <div style={{padding:20}}>No saved items yet.</div>;

  return (
    <div style={{padding:12}}>
      <h2>Saved</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
        {saved.map(item => (
          <div key={item._id} style={{background:'#000',color:'#fff',padding:8,borderRadius:8}} onClick={() => navigate(`/food/${item._id}`)}>
            <video src={item.video} style={{width:'100%',height:160,objectFit:'cover'}} muted />
            <div style={{paddingTop:8,fontSize:14}}>{item.name || 'Untitled'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Saved;
