
import { useMemo, useState } from 'react';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';

import {
  Content,
  Header,
  Page,
  Progress,
} from '@backstage/core-components';

import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from '@material-ui/core';

import { AikaApi } from '../../api/AikaApi';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export const AikaPage = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const api = useMemo(
    () => new AikaApi(discoveryApi, fetchApi),
    [discoveryApi, fetchApi],
  );

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const askAika = async () => {
    const trimmed = question.trim();

    if (!trimmed || loading) return;

    setMessages(previous => [
      ...previous,
      { role: 'user', content: trimmed },
    ]);

    setQuestion('');
    setLoading(true);
    setError('');

    try {
      const answer = await api.ask(trimmed);

      setMessages(previous => [
        ...previous,
        { role: 'assistant', content: answer },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page themeId="tool">
      <Header
        title="AIKA"
        subtitle="AI Knowledge Assistant"
      />

      <Content>
        <Box maxWidth={900} margin="auto">
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Ask your engineering platform
              </Typography>

              <Typography variant="body2" color="textSecondary">
                Ask questions about software services,
                ownership, APIs and your engineering platform.
              </Typography>
            </CardContent>
          </Card>

          <Box mt={3}>
            {messages.map((message, index) => (
              <Box key={index} mb={2}>
                <Card>
                  <CardContent>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                    >
                      {message.role === 'user' ? 'You' : 'AIKA'}
                    </Typography>

                    <Typography style={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>

          {loading && (
            <Box my={2}>
              <Progress />
            </Box>
          )}

          {error && (
            <Box my={2}>
              <Typography color="error">
                {error}
              </Typography>
            </Box>
          )}

          <Box mt={3}>
            <TextField
              fullWidth
              variant="outlined"
              label="Ask AIKA"
              placeholder="What is Backstage?"
              value={question}
              multiline
              rows={3}
              inputProps={{ maxLength: 4000 }}
              onChange={event =>
                setQuestion(event.target.value)
              }
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void askAika();
                }
              }}
            />

            <Box mt={2}>
              <Button
                variant="contained"
                color="primary"
                disabled={loading || !question.trim()}
                onClick={() => void askAika()}
              >
                Ask AIKA
              </Button>
            </Box>
          </Box>
        </Box>
      </Content>
    </Page>
  );
};
