import { ReactNode, useState, useEffect } from 'react';
import axios from 'axios';
import { token } from './envs';

const OWNER = 'alanakra';
const REPO = 'repo-test-jamespot';

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  branch: string;
}

async function getAllBranches() {
  try {
    // const token = process.env.GITHUB_TOKEN;
    const response = await axios.get(
      `https://api.github.com/repos/${OWNER}/${REPO}/branches`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    return response.data.map((branch: { name: string }) => branch.name);
  } catch (error) {
    console.error('Erreur lors de la récupération des branches :', error);
    throw error;
  }
}

async function getCommitsForBranch(branchName: string): Promise<Commit[]> {
  try {
    // const token = process.env.GITHUB_TOKEN;
    const response = await axios.get(
      `https://api.github.com/repos/${OWNER}/${REPO}/commits?sha=${branchName}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    return response.data.map((commit: any) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
      branch: branchName,
    }));
  } catch (error) {
    console.error(`Erreur lors de la récupération des commits pour ${branchName} :`, error);
    return [];
  }
}

async function getAllCommitsFromAllBranches(): Promise<{ commits: Commit[]; totalBranches: number }> {
  const branches = await getAllBranches();
  const allCommits: Commit[] = [];

  for (const branch of branches) {
    const commits = await getCommitsForBranch(branch);
    allCommits.push(...commits);
  }

  const uniqueCommits = Array.from(
    new Map(allCommits.map(commit => [commit.sha, commit])).values()
  );

  return {
    commits: uniqueCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    totalBranches: branches.length,
  };
}

export const Widget = (): ReactNode => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBranches, setTotalBranches] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllCommitsFromAllBranches();
      setCommits(result.commits);
      setTotalBranches(result.totalBranches);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des commits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateSha = (sha: string): string => sha.substring(0, 7);

  return (
    <>
    <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row', gap: '1rem' }}>
      <h1>Liste des commits du repo</h1>

      <button
        onClick={fetchData}
        disabled={loading}
        style={{
          marginBottom: '1rem',
          padding: '0.6rem 1rem',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: '#0366d6',
          color: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          width: 'fit-content'
        }}
      >
        {loading ? 'Chargement...' : '🔄 Rafraîchir les données'}
      </button>
    </div>

      {error && (
        <div
          style={{
            color: 'red',
            padding: '1rem',
            backgroundColor: '#fee',
            borderRadius: '4px',
          }}
        >
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
            }}
          >
            <p>
              <strong>Total de branches :</strong> {totalBranches}
            </p>
            <p>
              <strong>Total de commits uniques :</strong> {commits.length}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {commits.map((commit) => (
              <div
                key={commit.sha}
                style={{
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  color: '#fff',
                  backgroundColor: '#000',
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#58a6ff',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    Commit: {truncateSha(commit.sha)}
                  </a>
                  <span
                    style={{
                      marginLeft: '0.5rem',
                      fontSize: '0.9em',
                      color: '#aaa',
                    }}
                  >
                    Branche: {commit.branch}
                  </span>
                </div>
                <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
                  {commit.message.split('\n')[0]}
                </div>
                <div style={{ fontSize: '0.9em', color: '#aaa' }}>
                  <strong>Auteur :</strong> {commit.author} •{' '}
                  <strong>Date :</strong> {formatDate(commit.date)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};
